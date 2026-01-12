package com.webproblemshelper.hunyuan.console.persistence.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.apache.ibatis.type.JdbcType;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.webproblemshelper.hunyuan.console.persistence.converter.StringListJsonConverter;

@TableName("question_fill_blank")
public class FillBlankQuestionEntity {
    @TableId(value = "question_id", type = IdType.INPUT)
    private String questionId;

    @TableField(value = "answers_json", jdbcType = JdbcType.VARCHAR, typeHandler = StringListJsonConverter.class)
    private List<String> answers;

    @TableField("explanation")
    private String explanation;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
    }

    public List<String> getAnswers() {
        return answers;
    }

    public void setAnswers(List<String> answers) {
        this.answers = answers;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
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
