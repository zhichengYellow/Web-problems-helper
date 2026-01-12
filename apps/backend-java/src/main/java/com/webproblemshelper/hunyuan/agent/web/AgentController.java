package com.webproblemshelper.hunyuan.agent.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.webproblemshelper.hunyuan.agent.service.AgentAnswerService;
import com.webproblemshelper.hunyuan.agent.web.dto.AgentAnswerRequest;

import jakarta.validation.Valid;

@RestController
public class AgentController {
    private final AgentAnswerService agentAnswerService;

    public AgentController(AgentAnswerService agentAnswerService) {
        this.agentAnswerService = agentAnswerService;
    }

    @PostMapping("/api/agent/answer")
    public ResponseEntity<Map<String, Object>> answer(@Valid @RequestBody AgentAnswerRequest request) {
        try {
            return ResponseEntity.ok(agentAnswerService.answer(request));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "error", "Server configuration error: Missing API credentials",
                    "code", "MISSING_CREDENTIALS"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "error", e.getMessage(),
                    "code", "BAD_REQUEST"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "error", "Internal server error",
                    "code", "INTERNAL_ERROR"
            ));
        }
    }
}
