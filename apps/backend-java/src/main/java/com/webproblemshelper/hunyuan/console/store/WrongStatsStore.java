package com.webproblemshelper.hunyuan.console.store;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.webproblemshelper.hunyuan.console.persistence.entity.WrongStatEntity;
import com.webproblemshelper.hunyuan.console.persistence.repo.WrongStatRepository;
import com.webproblemshelper.hunyuan.console.web.dto.WrongStatDto;

@Service
public class WrongStatsStore {
    private final WrongStatRepository wrongStatRepository;

    public WrongStatsStore(WrongStatRepository wrongStatRepository) {
        this.wrongStatRepository = wrongStatRepository;
    }

    public Map<String, WrongStatDto> readAll() {
        Map<String, WrongStatDto> out = new HashMap<>();
        for (WrongStatEntity e : wrongStatRepository.selectList(null)) {
            out.put(e.getQuestionId(), toDto(e));
        }
        return out;
    }

    public Optional<WrongStatDto> get(String questionId) {
        if (questionId == null || questionId.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(wrongStatRepository.selectById(questionId)).map(WrongStatsStore::toDto);
    }

    @Transactional
    public WrongStatDto incrementWrong(String questionId) {
        if (questionId == null || questionId.isBlank()) {
            throw new IllegalArgumentException("questionId is required");
        }

        WrongStatEntity e = wrongStatRepository.selectById(questionId);
        boolean isCreate = false;
        if (e == null) {
            isCreate = true;
            e = new WrongStatEntity();
            e.setQuestionId(questionId);
            e.setWrongCount(0);
        }

        e.setWrongCount(e.getWrongCount() + 1);
        e.setLastWrongAt(Instant.now().toString());

        if (isCreate) {
            wrongStatRepository.insert(e);
        } else {
            wrongStatRepository.updateById(e);
        }
        return toDto(e);
    }

    private static WrongStatDto toDto(WrongStatEntity e) {
        WrongStatDto dto = new WrongStatDto();
        dto.setQuestionId(e.getQuestionId());
        dto.setWrongCount(e.getWrongCount());
        dto.setLastWrongAt(e.getLastWrongAt());
        return dto;
    }
}
