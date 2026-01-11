package com.ptahelper.hunyuan.console.config;

import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(ConsoleProperties.class)
public class ConsoleConfig {

    @Bean
    public Path consoleDataDir(ConsoleProperties properties) {
        try {
            Path dir = Path.of(properties.getDataDir()).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            return dir;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize console data directory", e);
        }
    }
}
