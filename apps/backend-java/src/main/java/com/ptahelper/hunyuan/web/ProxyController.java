package com.ptahelper.hunyuan.web;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.ptahelper.hunyuan.service.HunyuanProxyService;
import com.ptahelper.hunyuan.web.dto.BatchRequest;
import com.ptahelper.hunyuan.web.dto.ChatRequest;

import jakarta.validation.Valid;

@RestController
public class ProxyController {
    private final HunyuanProxyService proxyService;

    public ProxyController(HunyuanProxyService proxyService) {
        this.proxyService = proxyService;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> res = new HashMap<>();
        res.put("status", "ok");
        res.put("service", "tencent-hunyuan-proxy-java");
        res.put("timestamp", Instant.now().toString());
        return res;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        Map<String, Object> endpoints = Map.of(
                "health", "/health",
                "status", "/status",
                "chat", "/api/chat",
                "batch", "/api/batch"
        );
        Map<String, Object> res = new HashMap<>();
        res.put("service", "Tencent Cloud Hunyuan Proxy (Java)");
        res.put("version", "1.0.0");
        res.put("timestamp", Instant.now().toString());
        res.put("endpoints", endpoints);
        return res;
    }

    @PostMapping("/api/chat")
    public ResponseEntity<Map<String, Object>> chat(@Valid @RequestBody ChatRequest request) {
        try {
            Map<String, Object> data = proxyService.chat(request);
            return ResponseEntity.ok(data);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "error", "Server configuration error: Missing API credentials"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "error", "Internal server error",
                    "code", "INTERNAL_ERROR"
            ));
        }
    }

    @PostMapping("/api/batch")
    public ResponseEntity<Map<String, Object>> batch(@Valid @RequestBody BatchRequest request) {
        try {
            Map<String, Object> data = proxyService.batch(request);
            return ResponseEntity.ok(data);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "error", "Server configuration error: Missing API credentials"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "error", e.getMessage(),
                    "code", "BATCH_PROCESS_FAILED"
            ));
        }
    }
}
