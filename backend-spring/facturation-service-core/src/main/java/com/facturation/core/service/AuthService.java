package com.facturation.core.service;

import com.facturation.core.exception.BusinessException;
import com.facturation.core.model.AuthSession;
import com.facturation.core.model.User;
import com.facturation.core.port.PasswordHasher;
import com.facturation.core.port.TokenProvider;
import com.facturation.core.port.UserGateway;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserGateway userGateway;
    private final PasswordHasher passwordHasher;
    private final TokenProvider tokenProvider;

    public AuthSession login(String username, String password) {
        User user = userGateway.findByUsernameIgnoreCase(username == null ? "" : username.strip())
                .filter(User::isActive)
                .filter(candidate -> passwordHasher.matches(password, candidate.getPasswordHash()))
                .orElseThrow(() -> BusinessException.unauthorized("Identifiants invalides."));

        Instant now = Instant.now();
        user.setLastLoginAt(now);
        user.setUpdatedAt(now);
        User saved = userGateway.save(user);
        return new AuthSession(tokenProvider.createToken(saved), saved);
    }

    /** Résout l'utilisateur actif correspondant au jeton Bearer. */
    @Transactional(readOnly = true)
    public User authenticate(String token) {
        TokenProvider.TokenClaims claims = tokenProvider.parse(token);
        return userGateway.findById(claims.subject())
                .or(() -> userGateway.findByUsernameIgnoreCase(claims.username()))
                .filter(User::isActive)
                .orElseThrow(() -> BusinessException.unauthorized("Utilisateur introuvable."));
    }

    @Transactional(readOnly = true)
    public User currentUser(String userId) {
        return userGateway.findById(userId)
                .filter(User::isActive)
                .orElseThrow(() -> BusinessException.unauthorized("Utilisateur introuvable."));
    }
}
