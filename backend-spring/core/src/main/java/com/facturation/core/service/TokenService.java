package com.facturation.core.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

public class TokenService {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private final String secret;

    public TokenService(String secret) {
        this.secret = secret;
    }

    public String createToken(String subject, String username, String role, long expiresMinutes) {
        try {
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            long now = Instant.now().getEpochSecond();
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", subject);
            payload.put("username", username);
            payload.put("role", role);
            payload.put("iat", now);
            payload.put("exp", now + (expiresMinutes * 60));

            String headerPart = toB64Url(OBJECT_MAPPER.writeValueAsBytes(header));
            String payloadPart = toB64Url(OBJECT_MAPPER.writeValueAsBytes(payload));
            String signingInput = headerPart + "." + payloadPart;
            String signature = sign(signingInput);
            return signingInput + "." + signature;
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to create JWT token", ex);
        }
    }

    public Map<String, Object> decode(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid token format");
            }

            String signingInput = parts[0] + "." + parts[1];
            String expected = sign(signingInput);
            if (!expected.equals(parts[2])) {
                throw new IllegalArgumentException("Invalid token signature");
            }

            byte[] payloadBytes = Base64.getUrlDecoder().decode(withPadding(parts[1]));
            Map<String, Object> payload = OBJECT_MAPPER.readValue(payloadBytes, new TypeReference<>() {});
            long exp = ((Number) payload.getOrDefault("exp", 0)).longValue();
            if (Instant.now().getEpochSecond() > exp) {
                throw new IllegalArgumentException("Token expired");
            }
            return payload;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid token", ex);
        }
    }

    private String sign(String signingInput) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] signed = mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
        return toB64Url(signed);
    }

    private String toB64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String withPadding(String value) {
        int mod = value.length() % 4;
        if (mod == 0) {
            return value;
        }
        return value + "=".repeat(4 - mod);
    }
}
