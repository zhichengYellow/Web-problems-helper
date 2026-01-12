package com.webproblemshelper.hunyuan.console.persistence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("wrong_stats")
public class WrongStatEntity {
    @TableId(value = "question_id", type = IdType.INPUT)
    private String questionId;

    @TableField("wrong_count")
    private long wrongCount;

    @TableField("last_wrong_at")
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
