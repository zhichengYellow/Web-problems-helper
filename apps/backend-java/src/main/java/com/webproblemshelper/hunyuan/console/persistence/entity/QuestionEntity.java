package com.webproblemshelper.hunyuan.console.persistence.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.apache.ibatis.type.JdbcType;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.webproblemshelper.hunyuan.console.persistence.converter.ConsoleOptionListJsonConverter;
import com.webproblemshelper.hunyuan.console.persistence.converter.StringListJsonConverter;
import com.webproblemshelper.hunyuan.console.web.dto.ConsoleOptionDto;

@TableName("questions")
public class QuestionEntity {
    @TableId(value = "id", type = IdType.INPUT)
    private String id;

    @TableField("external_id")
    private String externalId;

    @TableField("platform")
    private String platform;

    @TableField("url")
    private String url;

    @TableField("type")
    private String type;

    @TableField("question_text")
    private String questionText;

    @TableField("answer")
    private String answer;

    @TableField("source")
    private String source;

    @TableField(value = "options_json", jdbcType = JdbcType.VARCHAR, typeHandler = ConsoleOptionListJsonConverter.class)
    private List<ConsoleOptionDto> options;

    @TableField(value = "knowledge_points_json", jdbcType = JdbcType.VARCHAR, typeHandler = StringListJsonConverter.class)
    private List<String> knowledgePoints;

    @TableField(value = "tags_json", jdbcType = JdbcType.VARCHAR, typeHandler = StringListJsonConverter.class)
    private List<String> tags;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getExternalId() {
        return externalId;
    }

    public void setExternalId(String externalId) {
        this.externalId = externalId;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public List<ConsoleOptionDto> getOptions() {
        return options;
    }

    public void setOptions(List<ConsoleOptionDto> options) {
        this.options = options;
    }

    public List<String> getKnowledgePoints() {
        return knowledgePoints;
    }

    public void setKnowledgePoints(List<String> knowledgePoints) {
        this.knowledgePoints = knowledgePoints;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
