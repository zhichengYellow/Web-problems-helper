package com.webproblemshelper.hunyuan.console.web;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.webproblemshelper.hunyuan.console.store.QuestionBankStore;
import com.webproblemshelper.hunyuan.console.store.WrongStatsStore;
import com.webproblemshelper.hunyuan.console.web.dto.QuestionDto;
import com.webproblemshelper.hunyuan.console.web.dto.WrongStatDto;

@RestController
@RequestMapping("/api/console")
public class ConsoleStatsController {
    private final QuestionBankStore questionBankStore;
    private final WrongStatsStore wrongStatsStore;

    public ConsoleStatsController(QuestionBankStore questionBankStore, WrongStatsStore wrongStatsStore) {
        this.questionBankStore = questionBankStore;
        this.wrongStatsStore = wrongStatsStore;
    }

    @PostMapping("/wrong/{questionId}")
    public ResponseEntity<Map<String, Object>> markWrong(@PathVariable("questionId") String questionId) {
        if (questionBankStore.getById(questionId).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "error", "Question not found",
                    "code", "NOT_FOUND"
            ));
        }
        WrongStatDto stat = wrongStatsStore.incrementWrong(questionId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "stat", stat
        ));
    }

    @GetMapping("/wrong")
    public Map<String, Object> listWrong() {
        Map<String, WrongStatDto> stats = wrongStatsStore.readAll();
        List<Map<String, Object>> items = new ArrayList<>();
        for (Map.Entry<String, WrongStatDto> entry : stats.entrySet()) {
            String questionId = entry.getKey();
            WrongStatDto stat = entry.getValue();
            QuestionDto question = questionBankStore.getById(questionId).orElse(null);
            if (question == null) {
                continue;
            }
            items.add(Map.of(
                    "question", question,
                    "stat", stat
            ));
        }
        items.sort(Comparator.comparingLong((Map<String, Object> it) -> ((WrongStatDto) it.get("stat")).getWrongCount()).reversed());
        return Map.of(
                "success", true,
                "count", items.size(),
                "items", items
        );
    }

    @GetMapping("/analytics/knowledge")
    public Map<String, Object> knowledgeAnalytics() {
        Map<String, WrongStatDto> stats = wrongStatsStore.readAll();
        Map<String, Long> wrongCountByKnowledge = new HashMap<>();
        Map<String, Long> wrongQuestionCountByKnowledge = new HashMap<>();

        for (Map.Entry<String, WrongStatDto> entry : stats.entrySet()) {
            String questionId = entry.getKey();
            WrongStatDto stat = entry.getValue();
            QuestionDto question = questionBankStore.getById(questionId).orElse(null);
            if (question == null || question.getKnowledgePoints() == null || question.getKnowledgePoints().isEmpty()) {
                continue;
            }
            for (String kpRaw : question.getKnowledgePoints()) {
                String kp = normalizeKey(kpRaw);
                if (kp.isBlank()) {
                    continue;
                }
                wrongCountByKnowledge.merge(kp, stat.getWrongCount(), Long::sum);
                wrongQuestionCountByKnowledge.merge(kp, 1L, Long::sum);
            }
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (String kp : wrongCountByKnowledge.keySet()) {
            items.add(Map.of(
                    "knowledgePoint", kp,
                    "wrongCount", wrongCountByKnowledge.getOrDefault(kp, 0L),
                    "wrongQuestionCount", wrongQuestionCountByKnowledge.getOrDefault(kp, 0L)
            ));
        }
        items.sort(Comparator.comparingLong((Map<String, Object> it) -> (Long) it.get("wrongCount")).reversed());
        return Map.of(
                "success", true,
                "count", items.size(),
                "items", items
        );
    }

    private static String normalizeKey(String s) {
        if (s == null) {
            return "";
        }
        return s.trim().toLowerCase(Locale.ROOT);
    }
}
