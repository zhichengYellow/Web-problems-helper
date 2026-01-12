package com.ptahelper.hunyuan.agent.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.ptahelper.hunyuan.agent.web.dto.AgentAnswerRequest;
import com.ptahelper.hunyuan.agent.web.dto.OptionDto;
import com.ptahelper.hunyuan.service.HunyuanProxyService;
import com.ptahelper.hunyuan.web.dto.ChatRequest;

@Service
public class AgentAnswerService {
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(10);
    private static final int DEFAULT_MAX_RETRIES = 2;

    private final HunyuanProxyService hunyuanProxyService;
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public AgentAnswerService(HunyuanProxyService hunyuanProxyService) {
        this.hunyuanProxyService = hunyuanProxyService;
    }

    public Map<String, Object> answer(AgentAnswerRequest request) throws Exception {
        String questionText = normalizeWhitespace(request.questionText());
        String questionType = normalizeType(request.questionType());
        List<OptionDto> options = request.options() == null ? List.of() : request.options();
        List<OptionDto> normalizedOptions = normalizeOptions(options);
        int maxRetries = request.maxRetries() == null ? DEFAULT_MAX_RETRIES : Math.max(0, request.maxRetries());

        validateRequest(questionText, questionType, normalizedOptions);

        String cacheKey = buildCacheKey(questionText, questionType, normalizedOptions);
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return Map.of(
                    "success", true,
                    "answer", cached.answer,
                    "questionType", questionType,
                    "confidence", cached.confidence,
                    "attempts", 0,
                    "cached", true,
                    "raw", cached.raw
            );
        }

        String prompt = buildPrompt(questionText, questionType, normalizedOptions);

        String bestAnswer = null;
        String bestRaw = null;
        double bestConfidence = 0.0;
        int attempts = 0;

        while (attempts <= maxRetries) {
            Map<String, Object> modelOptions = new HashMap<>();
            // 稳定优先：第一轮尽量确定性；重试时稍微增加随机性
            modelOptions.put("Temperature", attempts == 0 ? 0.1 : 0.3);
            modelOptions.put("TopP", 0.9);

            Map<String, Object> chatResult = hunyuanProxyService.chat(new ChatRequest(null, null, prompt, modelOptions, null));
            Map<String, Object> tencentData = safeMap(chatResult.get("data"));
            String raw = extractFirstAssistantContent(tencentData);

            Extraction extraction = extractAnswer(raw, questionType, normalizedOptions);
            double confidence = evaluateConfidence(extraction, raw, questionType, normalizedOptions);

            if (confidence > bestConfidence) {
                bestConfidence = confidence;
                bestAnswer = extraction.answer;
                bestRaw = raw;
            }

            // 通过“强校验”决定是否结束
            boolean valid = isValidAnswer(extraction.answer, questionType, normalizedOptions);
            if (valid && confidence >= 0.8) {
                CacheEntry entry = new CacheEntry(extraction.answer, raw, confidence, System.currentTimeMillis() + DEFAULT_TTL.toMillis());
                cache.put(cacheKey, entry);
                return Map.of(
                        "success", true,
                        "answer", extraction.answer,
                        "questionType", questionType,
                        "confidence", confidence,
                        "attempts", attempts + 1,
                        "cached", false,
                        "raw", raw
                );
            }

            attempts++;
        }

        if (bestAnswer != null) {
            CacheEntry entry = new CacheEntry(bestAnswer, bestRaw, bestConfidence, System.currentTimeMillis() + DEFAULT_TTL.toMillis());
            cache.put(cacheKey, entry);
        }

        return Map.of(
                "success", bestAnswer != null,
                "answer", bestAnswer,
                "questionType", questionType,
                "confidence", bestConfidence,
                "attempts", maxRetries + 1,
                "cached", false,
                "raw", bestRaw
        );
    }

    private void validateRequest(String questionText, String questionType, List<OptionDto> options) {
        if (questionText.isBlank()) {
            throw new IllegalArgumentException("questionText 不能为空");
        }
        if (("single_choice".equals(questionType) || "multiple_choice".equals(questionType))) {
            if (options == null || options.isEmpty()) {
                throw new IllegalArgumentException("选择题必须提供 options");
            }
            for (int i = 0; i < options.size(); i++) {
                OptionDto opt = options.get(i);
                if (opt == null || (isBlank(opt.text()) && isBlank(opt.value()))) {
                    throw new IllegalArgumentException("options[" + i + "] 需要至少包含 text 或 value");
                }
            }
        }
    }

    private static List<OptionDto> normalizeOptions(List<OptionDto> options) {
        if (options == null || options.isEmpty()) return List.of();
        List<OptionDto> res = new ArrayList<>(options.size());
        for (int i = 0; i < options.size(); i++) {
            OptionDto o = options.get(i);
            if (o == null) continue;
            String text = o.text();
            String value = o.value();

            String defaultValue = String.valueOf((char) ('A' + i));
            if (isBlank(value)) value = defaultValue;
            if (isBlank(text)) text = value;
            res.add(new OptionDto(text, value));
        }
        return res;
    }

    private static String normalizeType(String t) {
        if (t == null) return "other";
        String s = t.trim().toLowerCase(Locale.ROOT);
        if (s.isEmpty()) return "other";

        // 常见别名（英文/中文）统一到项目内部类型
        return switch (s) {
            case "single", "singlechoice", "single_choice", "单选", "单选题" -> "single_choice";
            case "multiple", "multichoice", "multiple_choice", "多选", "多选题" -> "multiple_choice";
            case "tf", "truefalse", "true_false", "judge", "boolean", "判断", "判断题" -> "true_false";
            case "blank", "fill", "fill_blank", "填空", "填空题" -> "fill_blank";
            case "short", "short_answer", "简答", "简答题" -> "short_answer";
            case "program", "programming", "code", "编程", "编程题" -> "programming";
            default -> s;
        };
    }

    private static String normalizeWhitespace(String s) {
        return s == null ? "" : s.replaceAll("\\s+", " ").trim();
    }

    private static String buildCacheKey(String questionText, String questionType, List<OptionDto> options) {
        StringBuilder sb = new StringBuilder();
        sb.append(questionType).append(':').append(questionText.toLowerCase(Locale.ROOT));
        if (options != null && !options.isEmpty()) {
            sb.append("|opts:");
            for (OptionDto o : options) {
                sb.append(o.value()).append('=').append(o.text()).append(';');
            }
        }
        return sb.toString();
    }

    private static String buildPrompt(String questionText, String questionType, List<OptionDto> options) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("请仔细分析以下题目并给出最准确的答案：\n\n");
        prompt.append("题目：").append(questionText).append("\n\n");

        if ("single_choice".equals(questionType) || "multiple_choice".equals(questionType)) {
            prompt.append("选项：\n");
            for (int i = 0; i < options.size(); i++) {
                char letter = (char) ('A' + i);
                prompt.append(letter).append(". ").append(options.get(i).text()).append("\n");
            }
            prompt.append("\n重要要求：\n");
            prompt.append("1. 请直接给出选项字母（如\"A\"或\"A,B,C\"）\n");
            prompt.append("2. 单选题只输出一个字母；多选题输出多个字母，用英文逗号分隔\n");
            prompt.append("3. 不要添加任何解释或额外文字\n");
            prompt.append("4. 如果不确定，也必须给出最可能的选项字母\n");
        } else if ("true_false".equals(questionType)) {
            prompt.append("请严格回答\"正确\"或\"错误\"，不要使用其他表述，也不要解释。\n");
        } else if ("fill_blank".equals(questionType)) {
            prompt.append("这是填空题：请只输出填空内容本身，不要解释，不要加多余前缀。\n");
        } else if ("short_answer".equals(questionType)) {
            prompt.append("这是简答题：请用一句话给出最准确的答案，尽量简洁，不要分点解释。\n");
        } else if ("programming".equals(questionType) || "code".equals(questionType)) {
            prompt.append("这是编程题：请输出可直接提交的完整代码，仅输出代码，不要解释。\n");
        } else {
            prompt.append("请直接给出最准确的答案，保持简洁，不要解释。\n");
        }

        return prompt.toString();
    }

    private static Extraction extractAnswer(String raw, String questionType, List<OptionDto> options) {
        String content = raw == null ? "" : raw.trim();

        if ("single_choice".equals(questionType) || "multiple_choice".equals(questionType)) {
            // 1) 直接抓取字母序列：A 或 A,B,C
            String letters = Regexes.firstMatch(content, Regexes.CHOICE_LETTERS);
            if (letters != null) {
                List<String> picked = new ArrayList<>();
                for (String part : letters.split("\\s*,\\s*")) {
                    if (part.length() == 1 && part.charAt(0) >= 'A' && part.charAt(0) <= 'Z') {
                        int idx = part.charAt(0) - 'A';
                        if (idx >= 0 && idx < options.size()) {
                            picked.add(options.get(idx).value());
                        }
                    }
                }
                String normalized = normalizeChoiceValues(picked);
                if (!normalized.isBlank()) {
                    return new Extraction(normalized, 0.9);
                }
            }

            // 2) 括号内字母
            String bracket = Regexes.firstGroup(content, Regexes.BRACKET_CHOICE, 1);
            if (bracket != null) {
                int idx = bracket.charAt(0) - 'A';
                if (idx >= 0 && idx < options.size()) {
                    return new Extraction(options.get(idx).value(), 0.8);
                }
            }

            // 3) 选项文本匹配（精确/包含）
            for (OptionDto opt : options) {
                if (opt == null) continue;
                String text = opt.text();
                if (text == null || text.isBlank()) continue;
                if (content.contains(text)) {
                    return new Extraction(opt.value(), 0.6);
                }
            }

            // 4) 数字索引（第一个/1/一）
            Integer n = ChineseNumbers.extractIndex(content);
            if (n != null && n >= 1 && n <= options.size()) {
                return new Extraction(options.get(n - 1).value(), 0.6);
            }

            return new Extraction(content, 0.3);
        }

        if ("true_false".equals(questionType)) {
            String c = content.toLowerCase(Locale.ROOT);
            if ("正确".equals(content) || "对".equals(content) || "true".equals(c)) {
                return new Extraction("正确", 0.9);
            }
            if ("错误".equals(content) || "错".equals(content) || "false".equals(c)) {
                return new Extraction("错误", 0.9);
            }
            if (content.contains("正确") || content.contains("对") || content.contains("是") || c.contains("true")) {
                return new Extraction("正确", 0.7);
            }
            if (content.contains("错误") || content.contains("错") || content.contains("否") || c.contains("false")) {
                return new Extraction("错误", 0.7);
            }
            return new Extraction(content, 0.4);
        }

        // 其他题型：直接返回（但去掉多余空白）
        return new Extraction(content, 0.6);
    }

    private static double evaluateConfidence(Extraction extraction, String raw, String questionType, List<OptionDto> options) {
        double base = extraction.baseConfidence;
        String answer = extraction.answer == null ? "" : extraction.answer;
        String content = raw == null ? "" : raw;

        if (("single_choice".equals(questionType) || "multiple_choice".equals(questionType))) {
            if (!isValidChoiceAnswer(answer, questionType, options)) {
                base *= 0.5;
            }
            if (content.length() > 100) {
                base *= 0.7;
            }
        } else if ("true_false".equals(questionType)) {
            if (!("正确".equals(answer) || "错误".equals(answer))) {
                base *= 0.7;
            }
        } else {
            if (content.length() < 50 && !content.contains("?")) {
                base = Math.max(base, 0.7);
            }
        }

        if (answer.isBlank()) {
            base = 0.0;
        }
        return Math.max(0.0, Math.min(1.0, base));
    }

    private static boolean isValidAnswer(String answer, String questionType, List<OptionDto> options) {
        if (answer == null || answer.isBlank()) return false;
        if ("single_choice".equals(questionType) || "multiple_choice".equals(questionType)) {
            return isValidChoiceAnswer(answer, questionType, options);
        }
        if ("true_false".equals(questionType)) {
            return "正确".equals(answer) || "错误".equals(answer);
        }
        // 其他题型：只要不是空即可
        return true;
    }

    private static boolean isValidChoiceAnswer(String answer, String questionType, List<OptionDto> options) {
        if (options == null || options.isEmpty()) return false;
        Set<String> allowed = new HashSet<>();
        for (OptionDto o : options) {
            if (o != null && !isBlank(o.value())) allowed.add(o.value());
        }

        List<String> parts = new ArrayList<>();
        for (String p : answer.split("\\s*,\\s*")) {
            if (!p.isBlank()) parts.add(p.trim());
        }
        if (parts.isEmpty()) return false;
        if ("single_choice".equals(questionType) && parts.size() != 1) return false;
        for (String p : parts) {
            if (!allowed.contains(p)) return false;
        }
        return true;
    }

    private static String normalizeChoiceValues(List<String> values) {
        if (values == null || values.isEmpty()) return "";
        // 去重 + 按 A,B,C 的顺序排序（如果 value 本身是字母）
        Set<String> set = new HashSet<>();
        for (String v : values) {
            if (v != null && !v.isBlank()) set.add(v.trim());
        }
        List<String> list = new ArrayList<>(set);
        list.sort(Comparator.comparingInt(AgentAnswerService::choiceOrder));
        return String.join(",", list);
    }

    private static int choiceOrder(String v) {
        if (v == null || v.isBlank()) return Integer.MAX_VALUE;
        String s = v.trim();
        if (s.length() == 1) {
            char c = s.charAt(0);
            if (c >= 'A' && c <= 'Z') return c - 'A';
        }
        return 1000 + Math.abs(Objects.hashCode(s));
    }

    private static String extractFirstAssistantContent(Map<String, Object> tencentData) {
        if (tencentData == null || tencentData.isEmpty()) return "";

        // 常见格式：{ Response: { Choices: [ { Message: { Content: "..." } } ] } }
        Object response = tencentData.get("Response");
        if (response instanceof Map<?, ?> respMap) {
            Object choices = respMap.get("Choices");
            if (choices instanceof List<?> list && !list.isEmpty()) {
                Object first = list.get(0);
                if (first instanceof Map<?, ?> firstMap) {
                    Object msg = firstMap.get("Message");
                    if (msg instanceof Map<?, ?> msgMap) {
                        Object content = msgMap.get("Content");
                        return content == null ? "" : content.toString();
                    }
                }
            }
        }

        // 兜底：如果后端将内容放在 Content/message
        Object content = tencentData.get("content");
        if (content != null) return content.toString();
        Object message = tencentData.get("message");
        if (message != null) return message.toString();
        return tencentData.toString();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> safeMap(Object o) {
        if (o instanceof Map<?, ?> m) {
            Map<String, Object> res = new HashMap<>();
            for (Map.Entry<?, ?> e : m.entrySet()) {
                if (e.getKey() != null) res.put(e.getKey().toString(), e.getValue());
            }
            return res;
        }
        return Map.of();
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private record CacheEntry(String answer, String raw, double confidence, long expiresAtMillis) {
        boolean isExpired() {
            return System.currentTimeMillis() > expiresAtMillis;
        }
    }

    private record Extraction(String answer, double baseConfidence) {
    }
}
