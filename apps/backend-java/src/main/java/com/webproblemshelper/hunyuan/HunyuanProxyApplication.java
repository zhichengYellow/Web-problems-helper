package com.webproblemshelper.hunyuan;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class HunyuanProxyApplication {
    public static void main(String[] args) {
        SpringApplication.run(HunyuanProxyApplication.class, args);
    }
}
