package com.facturation.backend.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class TokenService {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private final String secret;

    public TokenService(@Value("${app.auth.secret:dev-secret-change-me}") String secret) {
        this.secret = secret;
    }

    public String createToken(String subject, String username, String role) {
        try {
            long now = Instant.now().getEpochSecond();
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", subject);
            payload.put("username", username);
            payload.put("role", role);
            payload.put("iat", now);
            payload.put("exp", now + (8 * 60 * 60));

            String encodedHeader = b64Url(OBJECT_MAPPER.writeValueAsBytes(header));
            String encodedPayload = b64Url(OBJECT_MAPPER.writeValueAsBytes(payload));
            String signingInput = encodedHeader + "." + encodedPayload;
            return signingInput + "." + sign(signingInput);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to create token", ex);
        }
    }

    public Map<String, Object> decode(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid token format");
            }
            String signingInput = parts[0] + "." + parts[1];
            if (!sign(signingInput).equals(parts[2])) {
                throw new IllegalArgumentException("Invalid token signature");
            }

            Map<String, Object> payload = OBJECT_MAPPER.readValue(
                    Base64.getUrlDecoder().decode(withPadding(parts[1])),
                    new TypeReference<>() {
                    }
            );
            long exp = ((Number) payload.getOrDefault("exp", 0)).longValue();
            if (Instant.now().getEpochSecond() > exp) {
                throw new IllegalArgumentException("Token expired");
            }
            return payload;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Token invalide", ex);
        }
    }

    private String sign(String content) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return b64Url(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
    }

    private String b64Url(byte[] bytes) {
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
