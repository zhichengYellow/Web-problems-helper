package com.webproblemshelper.hunyuan.console.web;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.webproblemshelper.hunyuan.console.store.QuestionBankStore;
import com.webproblemshelper.hunyuan.console.web.dto.QuestionDto;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/console")
public class ConsoleQuestionController {
    private final QuestionBankStore questionBankStore;

    public ConsoleQuestionController(QuestionBankStore questionBankStore) {
        this.questionBankStore = questionBankStore;
    }

    @GetMapping("/questions")
    public Map<String, Object> list(@RequestParam(value = "query", required = false) String query) {
        List<QuestionDto> items = questionBankStore.list(query);
        return Map.of(
                "success", true,
                "count", items.size(),
                "items", items
        );
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable("id") String id) {
        return questionBankStore.getById(id)
                .<ResponseEntity<Map<String, Object>>>map(q -> ResponseEntity.ok(Map.of("success", true, "item", q)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "success", false,
                        "error", "Question not found",
                        "code", "NOT_FOUND"
                )));
    }

    @PostMapping("/questions")
    public Map<String, Object> create(@Valid @RequestBody QuestionDto input) {
        QuestionDto created = questionBankStore.create(input);
        return Map.of(
                "success", true,
                "item", created
        );
    }

    @PostMapping("/questions/import")
    public Map<String, Object> bulkImport(@RequestBody List<QuestionDto> items) {
        QuestionBankStore.ImportResult result = questionBankStore.bulkUpsert(items);
        return Map.of(
                "success", true,
                "created", result.created(),
                "updated", result.updated(),
                "count", (items == null ? 0 : items.size())
        );
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable("id") String id, @Valid @RequestBody QuestionDto input) {
        return questionBankStore.update(id, input)
                .<ResponseEntity<Map<String, Object>>>map(q -> ResponseEntity.ok(Map.of("success", true, "item", q)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "success", false,
                        "error", "Question not found",
                        "code", "NOT_FOUND"
                )));
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable("id") String id) {
        boolean removed = questionBankStore.delete(id);
        if (!removed) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "error", "Question not found",
                    "code", "NOT_FOUND"
            ));
        }
        return ResponseEntity.ok(Map.of("success", true));
    }
}
