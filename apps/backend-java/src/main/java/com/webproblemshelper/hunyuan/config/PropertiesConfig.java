package com.webproblemshelper.hunyuan.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(TencentProperties.class)
public class PropertiesConfig {
}
