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

@TableName("question_choice")
public class ChoiceQuestionEntity {
    @TableId(value = "question_id", type = IdType.INPUT)
    private String questionId;

    @TableField("mode")
    private String mode;

    @TableField(value = "options_json", jdbcType = JdbcType.VARCHAR, typeHandler = ConsoleOptionListJsonConverter.class)
    private List<ConsoleOptionDto> options;

    @TableField(value = "correct_options_json", jdbcType = JdbcType.VARCHAR, typeHandler = StringListJsonConverter.class)
    private List<String> correctOptions;

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

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public List<ConsoleOptionDto> getOptions() {
        return options;
    }

    public void setOptions(List<ConsoleOptionDto> options) {
        this.options = options;
    }

    public List<String> getCorrectOptions() {
        return correctOptions;
    }

    public void setCorrectOptions(List<String> correctOptions) {
        this.correctOptions = correctOptions;
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
