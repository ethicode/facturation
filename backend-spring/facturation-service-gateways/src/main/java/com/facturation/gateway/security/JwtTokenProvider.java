package com.facturation.gateway.security;

import com.facturation.core.exception.BusinessException;
import com.facturation.core.model.User;
import com.facturation.core.port.TokenProvider;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** JWT HS256 au même format que le backend Python (claims sub, username, role, iat, exp). */
@Component
public class JwtTokenProvider implements TokenProvider {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final ObjectMapper objectMapper;
    private final byte[] secret;
    private final Duration validity;

    public JwtTokenProvider(ObjectMapper objectMapper,
                            @Value("${app.security.jwt-secret}") String secret,
                            @Value("${app.security.jwt-validity}") Duration validity) {
        this.objectMapper = objectMapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.validity = validity;
    }

    @Override
    public String createToken(User user) {
        Instant now = Instant.now();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", user.getId());
        payload.put("username", user.getUsername());
        payload.put("role", user.getRole());
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", now.plus(validity).getEpochSecond());

        String signingInput = encode(Map.of("alg", "HS256", "typ", "JWT")) + "." + encode(payload);
        return signingInput + "." + base64Url(sign(signingInput));
    }

    @Override
    public TokenClaims parse(String token) {
        String[] parts = token == null ? new String[0] : token.split("\\.");
        if (parts.length != 3) {
            throw BusinessException.unauthorized("Token invalide.");
        }
        byte[] expected = sign(parts[0] + "." + parts[1]);
        byte[] actual;
        try {
            actual = Base64.getUrlDecoder().decode(parts[2]);
        } catch (IllegalArgumentException exception) {
            throw BusinessException.unauthorized("Token invalide.");
        }
        if (!MessageDigest.isEqual(expected, actual)) {
            throw BusinessException.unauthorized("Token invalide.");
        }

        JsonNode payload;
        try {
            payload = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[1]));
        } catch (IOException | IllegalArgumentException exception) {
            throw BusinessException.unauthorized("Token invalide.");
        }
        if (payload.path("exp").asLong(0) < Instant.now().getEpochSecond()) {
            throw BusinessException.unauthorized("Token invalide.");
        }
        return new TokenClaims(payload.path("sub").asText(null), payload.path("username").asText(null),
                payload.path("role").asText(null));
    }

    private String encode(Map<String, Object> json) {
        try {
            return base64Url(objectMapper.writeValueAsBytes(json));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private byte[] sign(String signingInput) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
            return mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC-SHA256 indisponible", exception);
        }
    }

    private static String base64Url(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }
}
