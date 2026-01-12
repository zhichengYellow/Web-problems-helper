package com.ptahelper.hunyuan.console.web;

import java.nio.file.Path;
import java.time.Instant;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ConsolePageController {
    private final Path consoleDataDir;

    public ConsolePageController(Path consoleDataDir) {
        this.consoleDataDir = consoleDataDir;
    }

    @GetMapping("/console")
    public String consoleRoot() {
        return "redirect:/console/index.html";
    }

    @GetMapping("/api/console/info")
    @ResponseBody
    public Map<String, Object> info() {
        return Map.of(
                "success", true,
                "timestamp", Instant.now().toString(),
                "dataDir", consoleDataDir.toString(),
                "endpoints", Map.of(
                        "questions", "/api/console/questions",
                        "wrong", "/api/console/wrong",
                        "knowledgeAnalytics", "/api/console/analytics/knowledge"
                )
        );
    }
}
