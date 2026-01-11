package com.ptahelper.hunyuan.web.dto;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotEmpty;

public record BatchRequest(
        String secretId,
        String secretKey,
        @NotEmpty List<String> messages,
        Map<String, Object> options,
        String region
) {
}
