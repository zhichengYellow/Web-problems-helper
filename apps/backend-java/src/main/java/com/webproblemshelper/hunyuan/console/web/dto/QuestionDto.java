package com.webproblemshelper.hunyuan.console.web.dto;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.constraints.NotBlank;

public class QuestionDto {
    private String id;

    /** stable id from source platform (e.g. leetcode:slug:two-sum) */
    private String externalId;

    /** platform id (pintia/leetcode/luogu/fenbi/chaoxing/unknown) */
    private String platform;

    /** source page url */
    private String url;

    @NotBlank
    private String type;

    @NotBlank
    private String questionText;

    private List<ConsoleOptionDto> options = new ArrayList<>();
    private String answer;
    private List<String> knowledgePoints = new ArrayList<>();
    private List<String> tags = new ArrayList<>();
    private String source;
    private String createdAt;
    private String updatedAt;

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

    public List<ConsoleOptionDto> getOptions() {
        return options;
    }

    public void setOptions(List<ConsoleOptionDto> options) {
        this.options = options == null ? new ArrayList<>() : options;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public List<String> getKnowledgePoints() {
        return knowledgePoints;
    }

    public void setKnowledgePoints(List<String> knowledgePoints) {
        this.knowledgePoints = knowledgePoints == null ? new ArrayList<>() : knowledgePoints;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags == null ? new ArrayList<>() : tags;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
