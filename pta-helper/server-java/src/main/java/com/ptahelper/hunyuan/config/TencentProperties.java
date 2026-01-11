package com.ptahelper.hunyuan.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pta.tencent")
public record TencentProperties(
        String secretId,
        String secretKey,
        String region,
        String version,
        String baseUrl,
        String service
) {
}
