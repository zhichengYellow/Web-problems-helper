package com.webproblemshelper.hunyuan.console.store;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.webproblemshelper.hunyuan.console.persistence.entity.QuestionEntity;
import com.webproblemshelper.hunyuan.console.persistence.entity.ChoiceQuestionEntity;
import com.webproblemshelper.hunyuan.console.persistence.entity.FillBlankQuestionEntity;
import com.webproblemshelper.hunyuan.console.persistence.entity.ProgrammingQuestionEntity;
import com.webproblemshelper.hunyuan.console.persistence.entity.TrueFalseQuestionEntity;
import com.webproblemshelper.hunyuan.console.persistence.repo.QuestionRepository;
import com.webproblemshelper.hunyuan.console.persistence.repo.ChoiceQuestionRepository;
import com.webproblemshelper.hunyuan.console.persistence.repo.FillBlankQuestionRepository;
import com.webproblemshelper.hunyuan.console.persistence.repo.ProgrammingQuestionRepository;
import com.webproblemshelper.hunyuan.console.persistence.repo.TrueFalseQuestionRepository;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.webproblemshelper.hunyuan.console.web.dto.QuestionDto;

@Service
public class QuestionBankStore {
    private final QuestionRepository questionRepository;
    private final ChoiceQuestionRepository choiceQuestionRepository;
    private final TrueFalseQuestionRepository trueFalseQuestionRepository;
    private final FillBlankQuestionRepository fillBlankQuestionRepository;
    private final ProgrammingQuestionRepository programmingQuestionRepository;

    public QuestionBankStore(
            QuestionRepository questionRepository,
            ChoiceQuestionRepository choiceQuestionRepository,
            TrueFalseQuestionRepository trueFalseQuestionRepository,
            FillBlankQuestionRepository fillBlankQuestionRepository,
            ProgrammingQuestionRepository programmingQuestionRepository) {
        this.questionRepository = questionRepository;
        this.choiceQuestionRepository = choiceQuestionRepository;
        this.trueFalseQuestionRepository = trueFalseQuestionRepository;
        this.fillBlankQuestionRepository = fillBlankQuestionRepository;
        this.programmingQuestionRepository = programmingQuestionRepository;
    }

    public List<QuestionDto> list(String query) {
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        LambdaQueryWrapper<QuestionEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(QuestionEntity::getUpdatedAt);
        if (!q.isEmpty()) {
            wrapper.and(w -> w
                    .like(QuestionEntity::getQuestionText, q)
                    .or().like(QuestionEntity::getAnswer, q)
                    .or().like(QuestionEntity::getSource, q)
                    .or().like(QuestionEntity::getType, q)
                    .or().like(QuestionEntity::getPlatform, q)
                    .or().like(QuestionEntity::getExternalId, q)
                    .or().like(QuestionEntity::getUrl, q));
        }
        return questionRepository.selectList(wrapper).stream().map(QuestionBankStore::toDto).toList();
    }

    @Cacheable(cacheNames = "questionById", key = "#id")
    public Optional<QuestionDto> getById(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(questionRepository.selectById(id)).map(QuestionBankStore::toDto);
    }

    @Transactional
    @CacheEvict(cacheNames = { "questionById", "questionByExternalId" }, allEntries = true)
    public QuestionDto create(QuestionDto input) {
        QuestionDto q = normalize(input);
        LocalDateTime now = LocalDateTime.now();

        QuestionEntity entity = new QuestionEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setExternalId(safeTrim(q.getExternalId()));
        entity.setPlatform(safeTrim(q.getPlatform()));
        entity.setUrl(safeTrim(q.getUrl()));
        entity.setType(safeTrim(q.getType()));
        entity.setQuestionText(safeTrim(q.getQuestionText()));
        entity.setAnswer(safeTrim(q.getAnswer()));
        entity.setSource(safeTrim(q.getSource()));
        entity.setOptions(q.getOptions());
        entity.setKnowledgePoints(q.getKnowledgePoints());
        entity.setTags(q.getTags());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        questionRepository.insert(entity);

        // Write into per-type table (best-effort, based on normalized type)
        syncSubtypeTables(entity.getId(), q, now);
        return toDto(entity);
    }

    @Transactional
    @CacheEvict(cacheNames = { "questionById", "questionByExternalId" }, allEntries = true)
    public QuestionDto upsertByExternalId(QuestionDto input) {
        QuestionDto normalized = normalize(input);
        String ext = safeTrim(normalized.getExternalId());

        // If externalId is missing, fallback to plain create
        if (ext == null || ext.isBlank()) {
            return create(normalized);
        }

        LocalDateTime now = LocalDateTime.now();
        QuestionEntity entity = questionRepository.selectOne(new LambdaQueryWrapper<QuestionEntity>()
                .eq(QuestionEntity::getExternalId, ext)
                .last("limit 1"));
        boolean isCreate = false;
        if (entity == null) {
            isCreate = true;
            entity = new QuestionEntity();
            entity.setId(UUID.randomUUID().toString());
            entity.setExternalId(ext);
            entity.setCreatedAt(now);
        }

        entity.setPlatform(safeTrim(normalized.getPlatform()));
        entity.setUrl(safeTrim(normalized.getUrl()));
        entity.setType(safeTrim(normalized.getType()));
        entity.setQuestionText(safeTrim(normalized.getQuestionText()));
        entity.setAnswer(safeTrim(normalized.getAnswer()));
        entity.setSource(safeTrim(normalized.getSource()));
        entity.setOptions(normalized.getOptions());
        entity.setKnowledgePoints(normalized.getKnowledgePoints());
        entity.setTags(normalized.getTags());
        entity.setUpdatedAt(now);

        if (isCreate) {
            questionRepository.insert(entity);
        } else {
            questionRepository.updateById(entity);
        }

        // Sync into per-type table
        syncSubtypeTables(entity.getId(), normalized, now);
        return toDto(entity);
    }

    @Transactional
    @CacheEvict(cacheNames = { "questionById", "questionByExternalId" }, allEntries = true)
    public ImportResult bulkUpsert(List<QuestionDto> inputs) {
        if (inputs == null || inputs.isEmpty()) {
            return new ImportResult(0, 0);
        }

        int created = 0;
        int updated = 0;
        for (QuestionDto it : inputs) {
            String ext = safeTrim(it == null ? null : it.getExternalId());
            boolean existed = ext != null && !ext.isBlank() && questionRepository.selectCount(
                    new LambdaQueryWrapper<QuestionEntity>().eq(QuestionEntity::getExternalId, ext)) > 0;
            upsertByExternalId(it);
            if (existed) {
                updated++;
            } else {
                created++;
            }
        }
        return new ImportResult(created, updated);
    }

    @Cacheable(cacheNames = "questionByExternalId", key = "#externalId")
    public Optional<QuestionDto> getByExternalId(String externalId) {
        String ext = safeTrim(externalId);
        if (ext == null || ext.isBlank()) {
            return Optional.empty();
        }
        QuestionEntity entity = questionRepository.selectOne(new LambdaQueryWrapper<QuestionEntity>()
                .eq(QuestionEntity::getExternalId, ext)
                .last("limit 1"));
        return Optional.ofNullable(entity).map(QuestionBankStore::toDto);
    }

    @Transactional
    @CacheEvict(cacheNames = { "questionById", "questionByExternalId" }, allEntries = true)
    public Optional<QuestionDto> update(String id, QuestionDto input) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }

        QuestionEntity existing = questionRepository.selectById(id);
        if (existing == null) {
            return Optional.empty();
        }
        QuestionDto merged = normalize(input);
        existing.setExternalId(safeTrim(merged.getExternalId()));
        existing.setPlatform(safeTrim(merged.getPlatform()));
        existing.setUrl(safeTrim(merged.getUrl()));
        existing.setType(safeTrim(merged.getType()));
        existing.setQuestionText(safeTrim(merged.getQuestionText()));
        existing.setAnswer(safeTrim(merged.getAnswer()));
        existing.setSource(safeTrim(merged.getSource()));
        existing.setOptions(merged.getOptions());
        existing.setKnowledgePoints(merged.getKnowledgePoints());
        existing.setTags(merged.getTags());
        existing.setUpdatedAt(LocalDateTime.now());
        questionRepository.updateById(existing);

        syncSubtypeTables(existing.getId(), merged, existing.getUpdatedAt());
        return Optional.of(toDto(existing));
    }

    @Transactional
    @CacheEvict(cacheNames = { "questionById", "questionByExternalId" }, allEntries = true)
    public boolean delete(String id) {
        if (id == null || id.isBlank()) {
            return false;
        }
        int removed = questionRepository.deleteById(id);
        if (removed <= 0) {
            return false;
        }
        // Clean subtype rows
        choiceQuestionRepository.deleteById(id);
        trueFalseQuestionRepository.deleteById(id);
        fillBlankQuestionRepository.deleteById(id);
        programmingQuestionRepository.deleteById(id);
        return true;
    }

    private static QuestionDto normalize(QuestionDto input) {
        QuestionDto q = new QuestionDto();
        q.setExternalId(safeTrim(input == null ? null : input.getExternalId()));
        q.setPlatform(safeTrim(input == null ? null : input.getPlatform()));
        q.setUrl(safeTrim(input == null ? null : input.getUrl()));
        q.setType(normalizeType(input == null ? null : input.getType()));
        q.setQuestionText(safeTrim(input == null ? null : input.getQuestionText()));
        q.setAnswer(safeTrim(input == null ? null : input.getAnswer()));
        q.setSource(safeTrim(input == null ? null : input.getSource()));
        q.setOptions(input == null ? List.of() : input.getOptions());
        q.setKnowledgePoints(input == null ? List.of() : input.getKnowledgePoints());
        q.setTags(input == null ? List.of() : input.getTags());
        return q;
    }

    /**
     * Classic question type names (recommended):
     * single_choice / multiple_choice / true_false / fill_blank / function / programming
     *
     * Also accepts legacy values from extension: choice / judge / fill / programming.
     */
    private static String normalizeType(String raw) {
        String s = safeTrim(raw);
        if (s == null || s.isBlank()) {
            return "programming";
        }
        s = s.toLowerCase(Locale.ROOT);
        return switch (s) {
            case "single", "single_choice", "single-choice", "radio", "choice" -> "single_choice";
            case "multiple", "multi", "multiple_choice", "multiple-choice", "checkbox" -> "multiple_choice";
            case "judge", "true_false", "true-false", "tf", "boolean" -> "true_false";
            case "fill", "fill_blank", "fill-blank", "blank" -> "fill_blank";
            case "function", "function_design", "func" -> "function";
            case "programming", "coding", "code" -> "programming";
            default -> s;
        };
    }

    private void syncSubtypeTables(String questionId, QuestionDto q, LocalDateTime now) {
        if (questionId == null || questionId.isBlank() || q == null) {
            return;
        }

        String type = normalizeType(q.getType());

        // Clean non-matching subtype rows to keep consistency
        // (This is conservative; if you want to keep historical subtype data, remove these deletes.)
        if (!type.equals("single_choice") && !type.equals("multiple_choice")) {
            choiceQuestionRepository.deleteById(questionId);
        }
        if (!type.equals("true_false")) {
            trueFalseQuestionRepository.deleteById(questionId);
        }
        if (!type.equals("fill_blank")) {
            fillBlankQuestionRepository.deleteById(questionId);
        }
        if (!type.equals("programming") && !type.equals("function")) {
            programmingQuestionRepository.deleteById(questionId);
        }

        if (type.equals("single_choice") || type.equals("multiple_choice")) {
            ChoiceQuestionEntity e = choiceQuestionRepository.selectById(questionId);
            boolean isCreate = false;
            if (e == null) {
                isCreate = true;
                e = new ChoiceQuestionEntity();
                e.setQuestionId(questionId);
                e.setCreatedAt(now);
            }
            e.setMode(type);
            e.setOptions(q.getOptions());
            e.setCorrectOptions(parseChoiceCorrectOptions(q.getAnswer()));
            e.setExplanation(null);
            e.setUpdatedAt(now);
            if (isCreate) {
                choiceQuestionRepository.insert(e);
            } else {
                choiceQuestionRepository.updateById(e);
            }
            return;
        }

        if (type.equals("true_false")) {
            TrueFalseQuestionEntity e = trueFalseQuestionRepository.selectById(questionId);
            boolean isCreate = false;
            if (e == null) {
                isCreate = true;
                e = new TrueFalseQuestionEntity();
                e.setQuestionId(questionId);
                e.setCreatedAt(now);
            }
            e.setCorrect(parseTrueFalse(q.getAnswer()));
            e.setExplanation(null);
            e.setUpdatedAt(now);
            if (isCreate) {
                trueFalseQuestionRepository.insert(e);
            } else {
                trueFalseQuestionRepository.updateById(e);
            }
            return;
        }

        if (type.equals("fill_blank")) {
            FillBlankQuestionEntity e = fillBlankQuestionRepository.selectById(questionId);
            boolean isCreate = false;
            if (e == null) {
                isCreate = true;
                e = new FillBlankQuestionEntity();
                e.setQuestionId(questionId);
                e.setCreatedAt(now);
            }
            e.setAnswers(parseFillBlankAnswers(q.getAnswer()));
            e.setExplanation(null);
            e.setUpdatedAt(now);
            if (isCreate) {
                fillBlankQuestionRepository.insert(e);
            } else {
                fillBlankQuestionRepository.updateById(e);
            }
            return;
        }

        if (type.equals("programming") || type.equals("function")) {
            ProgrammingQuestionEntity e = programmingQuestionRepository.selectById(questionId);
            boolean isCreate = false;
            if (e == null) {
                isCreate = true;
                e = new ProgrammingQuestionEntity();
                e.setQuestionId(questionId);
                e.setCreatedAt(now);
            }
            e.setSubtype(type);
            e.setLanguage(null);
            e.setStarterCode(null);
            e.setReferenceAnswer(q.getAnswer());
            e.setExplanation(null);
            e.setUpdatedAt(now);
            if (isCreate) {
                programmingQuestionRepository.insert(e);
            } else {
                programmingQuestionRepository.updateById(e);
            }
        }
    }

    private static List<String> parseChoiceCorrectOptions(String answer) {
        String s = safeTrim(answer);
        if (s == null || s.isBlank()) {
            return List.of();
        }
        // Extract option keys like A/B/C/D from text such as "A", "AC", "A,C", "答案：B"
        Set<String> keys = new LinkedHashSet<>();
        for (int i = 0; i < s.length(); i++) {
            char c = Character.toUpperCase(s.charAt(i));
            if (c >= 'A' && c <= 'H') {
                keys.add(String.valueOf(c));
            }
        }
        return new ArrayList<>(keys);
    }

    private static Boolean parseTrueFalse(String answer) {
        String s = safeTrim(answer);
        if (s == null || s.isBlank()) {
            return null;
        }
        s = s.toLowerCase(Locale.ROOT);
        // true-ish
        if (s.contains("true") || s.contains("正确") || s.contains("对") || s.equals("1") || s.contains("yes") || s.contains("是")) {
            return true;
        }
        // false-ish
        if (s.contains("false") || s.contains("错误") || s.contains("错") || s.equals("0") || s.contains("no") || s.contains("否") || s.contains("不是")) {
            return false;
        }
        return null;
    }

    private static List<String> parseFillBlankAnswers(String answer) {
        String s = safeTrim(answer);
        if (s == null || s.isBlank()) {
            return List.of();
        }
        // Split by common separators; keep non-empty
        String[] parts = s.split("[\n\r;；|，,]");
        List<String> out = new ArrayList<>();
        for (String p : parts) {
            String t = safeTrim(p);
            if (t != null && !t.isBlank()) {
                out.add(t);
            }
        }
        if (out.isEmpty()) {
            return List.of(s);
        }
        return out;
    }

    public record ImportResult(int created, int updated) {
    }

    private static String safeTrim(String s) {
        return s == null ? null : s.trim();
    }

    private static QuestionDto toDto(QuestionEntity e) {
        QuestionDto q = new QuestionDto();
        q.setId(e.getId());
        q.setExternalId(e.getExternalId());
        q.setPlatform(e.getPlatform());
        q.setUrl(e.getUrl());
        q.setType(e.getType());
        q.setQuestionText(e.getQuestionText());
        q.setAnswer(e.getAnswer());
        q.setSource(e.getSource());
        q.setOptions(e.getOptions() == null ? List.of() : e.getOptions());
        q.setKnowledgePoints(e.getKnowledgePoints() == null ? List.of() : e.getKnowledgePoints());
        q.setTags(e.getTags() == null ? List.of() : e.getTags());
        q.setCreatedAt(e.getCreatedAt() == null ? null : e.getCreatedAt().toString());
        q.setUpdatedAt(e.getUpdatedAt() == null ? null : e.getUpdatedAt().toString());
        return q;
    }
}
