package com.webproblemshelper.hunyuan.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wph.tencent")
public record TencentProperties(
        String secretId,
        String secretKey,
        String region,
        String version,
        String baseUrl,
        String service
) {
}
