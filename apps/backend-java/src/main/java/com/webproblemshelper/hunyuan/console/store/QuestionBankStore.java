package com.webproblemshelper.hunyuan.console.store;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.webproblemshelper.hunyuan.console.persistence.entity.QuestionEntity;
import com.webproblemshelper.hunyuan.console.persistence.repo.QuestionRepository;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.webproblemshelper.hunyuan.console.web.dto.QuestionDto;

@Service
public class QuestionBankStore {
    private final QuestionRepository questionRepository;

    public QuestionBankStore(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
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
        return Optional.of(toDto(existing));
    }

    @Transactional
    @CacheEvict(cacheNames = { "questionById", "questionByExternalId" }, allEntries = true)
    public boolean delete(String id) {
        if (id == null || id.isBlank()) {
            return false;
        }
        return questionRepository.deleteById(id) > 0;
    }

    private static QuestionDto normalize(QuestionDto input) {
        QuestionDto q = new QuestionDto();
        q.setExternalId(safeTrim(input == null ? null : input.getExternalId()));
        q.setPlatform(safeTrim(input == null ? null : input.getPlatform()));
        q.setUrl(safeTrim(input == null ? null : input.getUrl()));
        q.setType(safeTrim(input == null ? null : input.getType()));
        q.setQuestionText(safeTrim(input == null ? null : input.getQuestionText()));
        q.setAnswer(safeTrim(input == null ? null : input.getAnswer()));
        q.setSource(safeTrim(input == null ? null : input.getSource()));
        q.setOptions(input == null ? List.of() : input.getOptions());
        q.setKnowledgePoints(input == null ? List.of() : input.getKnowledgePoints());
        q.setTags(input == null ? List.of() : input.getTags());
        return q;
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
