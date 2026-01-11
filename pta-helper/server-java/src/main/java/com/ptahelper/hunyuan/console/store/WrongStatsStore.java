package com.ptahelper.hunyuan.console.store;

import java.nio.file.Path;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ptahelper.hunyuan.console.web.dto.WrongStatDto;

@Service
public class WrongStatsStore {
    private final JsonFileStore<Map<String, WrongStatDto>> store;

    public WrongStatsStore(ObjectMapper objectMapper, Path consoleDataDir) {
        this.store = new JsonFileStore<>(
                objectMapper,
                consoleDataDir.resolve("wrong-stats.json"),
                new TypeReference<Map<String, WrongStatDto>>() {
                }
        );
    }

    public Map<String, WrongStatDto> readAll() {
        return new HashMap<>(store.readOrDefault(Map.of()));
    }

    public Optional<WrongStatDto> get(String questionId) {
        if (questionId == null || questionId.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(store.readOrDefault(Map.of()).get(questionId));
    }

    public WrongStatDto incrementWrong(String questionId) {
        if (questionId == null || questionId.isBlank()) {
            throw new IllegalArgumentException("questionId is required");
        }
        Map<String, WrongStatDto> all = new HashMap<>(store.readOrDefault(Map.of()));
        WrongStatDto stat = all.getOrDefault(questionId, new WrongStatDto());
        stat.setQuestionId(questionId);
        stat.setWrongCount(stat.getWrongCount() + 1);
        stat.setLastWrongAt(Instant.now().toString());
        all.put(questionId, stat);
        store.write(all);
        return stat;
    }
}
