package com.facturation.gateway.security;

import com.facturation.core.port.PasswordHasher;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import org.springframework.stereotype.Component;

/**
 * PBKDF2-HMAC-SHA256 compatible avec les hash produits par le backend Python
 * ({@code pbkdf2_sha256$<sel base64>$<hash base64>}, 200 000 itérations).
 */
@Component
public class Pbkdf2PasswordHasher implements PasswordHasher {

    private static final String PREFIX = "pbkdf2_sha256";
    private static final int ITERATIONS = 200_000;
    private static final int KEY_LENGTH_BITS = 256;
    private static final int SALT_LENGTH = 16;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public String hash(String rawPassword) {
        byte[] salt = new byte[SALT_LENGTH];
        secureRandom.nextBytes(salt);
        Base64.Encoder encoder = Base64.getEncoder();
        return PREFIX + "$" + encoder.encodeToString(salt) + "$" + encoder.encodeToString(derive(rawPassword, salt));
    }

    @Override
    public boolean matches(String rawPassword, String storedHash) {
        if (rawPassword == null || storedHash == null || storedHash.isEmpty()) {
            return false;
        }
        if (storedHash.startsWith(PREFIX + "$")) {
            String[] parts = storedHash.split("\\$", 3);
            if (parts.length != 3) {
                return false;
            }
            Base64.Decoder decoder = Base64.getDecoder();
            byte[] expected = decoder.decode(parts[2]);
            return MessageDigest.isEqual(derive(rawPassword, decoder.decode(parts[1])), expected);
        }
        // Ancien format : SHA-256 hexadécimal sans sel.
        byte[] legacy = sha256(rawPassword);
        return MessageDigest.isEqual(HexFormat.of().formatHex(legacy).getBytes(StandardCharsets.US_ASCII),
                storedHash.getBytes(StandardCharsets.US_ASCII));
    }

    private static byte[] derive(String password, byte[] salt) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH_BITS);
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("PBKDF2 indisponible", exception);
        }
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("SHA-256 indisponible", exception);
        }
    }
}
