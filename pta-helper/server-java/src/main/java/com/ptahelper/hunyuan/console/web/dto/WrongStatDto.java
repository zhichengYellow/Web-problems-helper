package com.ptahelper.hunyuan.console.web.dto;

public class WrongStatDto {
    private String questionId;
    private long wrongCount;
    private String lastWrongAt;

    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
    }

    public long getWrongCount() {
        return wrongCount;
    }

    public void setWrongCount(long wrongCount) {
        this.wrongCount = wrongCount;
    }

    public String getLastWrongAt() {
        return lastWrongAt;
    }

    public void setLastWrongAt(String lastWrongAt) {
        this.lastWrongAt = lastWrongAt;
    }
}
