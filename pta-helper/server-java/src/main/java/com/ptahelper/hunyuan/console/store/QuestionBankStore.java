package com.ptahelper.hunyuan.console.store;

import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ptahelper.hunyuan.console.web.dto.QuestionDto;

@Service
public class QuestionBankStore {
    private final JsonFileStore<List<QuestionDto>> store;

    public QuestionBankStore(ObjectMapper objectMapper, Path consoleDataDir) {
        this.store = new JsonFileStore<>(
                objectMapper,
                consoleDataDir.resolve("question-bank.json"),
                new TypeReference<List<QuestionDto>>() {
                }
        );
    }

    public List<QuestionDto> list(String query) {
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        List<QuestionDto> all = new ArrayList<>(store.readOrDefault(List.of()));
        if (!q.isEmpty()) {
            all = all.stream()
                    .filter(it -> containsIgnoreCase(it.getQuestionText(), q)
                            || containsIgnoreCase(it.getAnswer(), q)
                            || containsAnyIgnoreCase(it.getKnowledgePoints(), q)
                            || containsAnyIgnoreCase(it.getTags(), q)
                            || containsIgnoreCase(it.getSource(), q)
                            || containsIgnoreCase(it.getType(), q))
                    .collect(Collectors.toCollection(ArrayList::new));
        }
        all.sort(Comparator.comparing(QuestionDto::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return all;
    }

    public Optional<QuestionDto> getById(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        return store.readOrDefault(List.of()).stream()
                .filter(q -> id.equals(q.getId()))
                .findFirst();
    }

    public QuestionDto create(QuestionDto input) {
        List<QuestionDto> all = new ArrayList<>(store.readOrDefault(List.of()));
        QuestionDto q = normalize(input);
        q.setId(UUID.randomUUID().toString());
        String now = Instant.now().toString();
        q.setCreatedAt(now);
        q.setUpdatedAt(now);
        all.add(q);
        store.write(all);
        return q;
    }

    public Optional<QuestionDto> update(String id, QuestionDto input) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        List<QuestionDto> all = new ArrayList<>(store.readOrDefault(List.of()));
        for (int i = 0; i < all.size(); i++) {
            if (id.equals(all.get(i).getId())) {
                QuestionDto existing = all.get(i);
                QuestionDto merged = normalize(input);
                merged.setId(existing.getId());
                merged.setCreatedAt(existing.getCreatedAt());
                merged.setUpdatedAt(Instant.now().toString());
                all.set(i, merged);
                store.write(all);
                return Optional.of(merged);
            }
        }
        return Optional.empty();
    }

    public boolean delete(String id) {
        if (id == null || id.isBlank()) {
            return false;
        }
        List<QuestionDto> all = new ArrayList<>(store.readOrDefault(List.of()));
        boolean removed = all.removeIf(q -> id.equals(q.getId()));
        if (removed) {
            store.write(all);
        }
        return removed;
    }

    private static QuestionDto normalize(QuestionDto input) {
        QuestionDto q = new QuestionDto();
        q.setType(safeTrim(input == null ? null : input.getType()));
        q.setQuestionText(safeTrim(input == null ? null : input.getQuestionText()));
        q.setAnswer(safeTrim(input == null ? null : input.getAnswer()));
        q.setSource(safeTrim(input == null ? null : input.getSource()));
        q.setOptions(input == null ? List.of() : input.getOptions());
        q.setKnowledgePoints(input == null ? List.of() : input.getKnowledgePoints());
        q.setTags(input == null ? List.of() : input.getTags());
        return q;
    }

    private static String safeTrim(String s) {
        return s == null ? null : s.trim();
    }

    private static boolean containsIgnoreCase(String text, String queryLower) {
        if (text == null || text.isBlank() || queryLower == null || queryLower.isBlank()) {
            return false;
        }
        return text.toLowerCase(Locale.ROOT).contains(queryLower);
    }

    private static boolean containsAnyIgnoreCase(List<String> list, String queryLower) {
        if (list == null || list.isEmpty()) {
            return false;
        }
        for (String item : list) {
            if (containsIgnoreCase(item, queryLower)) {
                return true;
            }
        }
        return false;
    }
}
