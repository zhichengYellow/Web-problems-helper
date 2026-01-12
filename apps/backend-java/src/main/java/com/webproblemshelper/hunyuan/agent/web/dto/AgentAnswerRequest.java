package com.webproblemshelper.hunyuan.agent.web.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public record AgentAnswerRequest(
        @NotBlank String questionText,
        String questionType,
        List<OptionDto> options,
        Integer maxRetries
) {
}
