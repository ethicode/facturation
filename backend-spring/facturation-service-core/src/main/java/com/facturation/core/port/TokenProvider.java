package com.facturation.core.port;

import com.facturation.core.model.User;

public interface TokenProvider {

    String createToken(User user);

    /** @throws com.facturation.core.exception.BusinessException si le jeton est invalide ou expiré */
    TokenClaims parse(String token);

    record TokenClaims(String subject, String username, String role) {
    }
}
