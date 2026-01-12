package com.webproblemshelper.hunyuan.web.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(
        String secretId,
        String secretKey,
        @NotBlank String message,
        Map<String, Object> options,
        String region
) {
}
