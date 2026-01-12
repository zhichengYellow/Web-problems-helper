package com.webproblemshelper.hunyuan.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.webproblemshelper.hunyuan.config.TencentProperties;
import com.webproblemshelper.hunyuan.web.dto.BatchRequest;
import com.webproblemshelper.hunyuan.web.dto.ChatRequest;

@Service
public class HunyuanProxyService {
    private static final int MAX_BATCH_SIZE = 10;

    private final TencentProperties props;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public HunyuanProxyService(TencentProperties props, ObjectMapper objectMapper) {
        this.props = props;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().build();
    }

    public Map<String, Object> chat(ChatRequest request) throws Exception {
        String secretId = firstNonBlank(request.secretId(), props.secretId());
        String secretKey = firstNonBlank(request.secretKey(), props.secretKey());
        if (isBlank(secretId) || isBlank(secretKey)) {
            throw new IllegalStateException("Missing API credentials");
        }
        String region = firstNonBlank(request.region(), props.region());

        long epochSeconds = Instant.now().getEpochSecond();
        String timestamp = Long.toString(epochSeconds);
        String date = DateTimeFormatter.ofPattern("yyyy-MM-dd")
                .withZone(ZoneOffset.UTC)
                .format(Instant.ofEpochSecond(epochSeconds));

        Map<String, Object> payload = buildPayload(request.message(), request.options());
        String payloadJson = objectMapper.writeValueAsString(payload);

        String signature = TencentTc3Signer.sign(secretId, secretKey, props.service(), timestamp, date, payloadJson);
        String authorization = "TC3-HMAC-SHA256 Credential=" + secretId + "/" + date + "/" + props.service()
                + "/tc3_request, SignedHeaders=content-type;host, Signature=" + signature;

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(props.baseUrl()))
                .header("Content-Type", "application/json")
                .header("Authorization", authorization)
                .header("X-TC-Action", "ChatCompletions")
                .header("X-TC-Version", props.version())
                .header("X-TC-Timestamp", timestamp)
                .header("X-TC-Region", region)
                .POST(HttpRequest.BodyPublishers.ofString(payloadJson, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new RuntimeException("Tencent API error: HTTP " + response.statusCode() + " - " + response.body());
        }

        Map<String, Object> tencentResponse = objectMapper.readValue(response.body(), new TypeReference<>() {});
        Map<String, Object> responseObj = new HashMap<>();
        responseObj.put("success", true);
        responseObj.put("data", tencentResponse);

        // Best-effort: extract usage/requestId if present
        Object resp = tencentResponse.get("Response");
        if (resp instanceof Map<?, ?> respMap) {
            Object usage = respMap.get("Usage");
            Object requestId = respMap.get("RequestId");
            if (usage != null) responseObj.put("usage", usage);
            if (requestId != null) responseObj.put("requestId", requestId);

            Object error = respMap.get("Error");
            if (error instanceof Map<?, ?> errMap && errMap.get("Code") != null) {
                Object message = errMap.get("Message");
                throw new RuntimeException("TencentCloud API error: " + message);
            }
        }
        return responseObj;
    }

    public Map<String, Object> batch(BatchRequest request) throws Exception {
        String secretId = firstNonBlank(request.secretId(), props.secretId());
        String secretKey = firstNonBlank(request.secretKey(), props.secretKey());
        if (isBlank(secretId) || isBlank(secretKey)) {
            throw new IllegalStateException("Missing API credentials");
        }

        List<String> messages = request.messages();
        if (messages == null || messages.isEmpty()) {
            throw new IllegalArgumentException("Invalid messages array");
        }

        String region = firstNonBlank(request.region(), props.region());
        Map<String, Object> options = request.options();

        List<String> sliced = messages.size() > MAX_BATCH_SIZE ? messages.subList(0, MAX_BATCH_SIZE) : messages;
        List<Map<String, Object>> results = new ArrayList<>();

        for (String msg : sliced) {
            try {
                ChatRequest chatReq = new ChatRequest(secretId, secretKey, msg, options, region);
                Map<String, Object> chatRes = chat(chatReq);
                Map<String, Object> item = new HashMap<>();
                item.put("success", true);
                item.put("message", msg);
                item.put("data", chatRes.get("data"));
                if (chatRes.get("requestId") != null) item.put("requestId", chatRes.get("requestId"));
                results.add(item);
            } catch (Exception e) {
                Map<String, Object> item = new HashMap<>();
                item.put("success", false);
                item.put("message", msg);
                item.put("error", e.getMessage());
                results.add(item);
            }

            try {
                Thread.sleep(100);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }

        return Map.of(
                "success", true,
                "processed", results.size(),
                "results", results
        );
    }

    private Map<String, Object> buildPayload(String message, Map<String, Object> options) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("Model", "hunyuan-lite");
        payload.put("Messages", List.of(Map.of(
                "Role", "user",
                "Content", message
        )));
        payload.put("Stream", false);

        if (options != null && !options.isEmpty()) {
            payload.putAll(options);
        }
        return payload;
    }

    private static String firstNonBlank(String a, String b) {
        return isBlank(a) ? b : a;
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
