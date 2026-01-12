package com.webproblemshelper.hunyuan.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

final class TencentTc3Signer {
    private TencentTc3Signer() {
    }

    public static String sign(
            String secretId,
            String secretKey,
            String service,
            String timestamp,
            String dateForCredential,
            String payloadJson
    ) {
        String hashedPayload = sha256Hex(payloadJson);

        String canonicalRequest = String.join("\n",
                "POST",
                "/",
                "",
                "content-type:application/json",
                "host:hunyuan.tencentcloudapi.com",
                "",
                "content-type;host",
                hashedPayload
        );

        String hashedCanonicalRequest = sha256Hex(canonicalRequest);
        String credentialScope = dateForCredential + "/" + service + "/tc3_request";
        String stringToSign = String.join("\n",
                "TC3-HMAC-SHA256",
                timestamp,
                credentialScope,
                hashedCanonicalRequest
        );

        byte[] secretDate = hmacSha256(("TC3" + secretKey).getBytes(StandardCharsets.UTF_8), dateForCredential);
        byte[] secretService = hmacSha256(secretDate, service);
        byte[] secretSigning = hmacSha256(secretService, "tc3_request");
        return hmacSha256Hex(secretSigning, stringToSign);
    }

    private static String sha256Hex(String message) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(message.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static byte[] hmacSha256(byte[] key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static String hmacSha256Hex(byte[] key, String data) {
        return toHex(hmacSha256(key, data));
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
