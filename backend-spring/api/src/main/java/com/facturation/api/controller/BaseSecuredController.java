package com.facturation.api.controller;

import com.facturation.core.service.BackendService;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

public abstract class BaseSecuredController {
    protected final BackendService backendService;

    protected BaseSecuredController(BackendService backendService) {
        this.backendService = backendService;
    }

    protected Map<String, Object> requireUser(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token manquant.");
        }
        String token = authorizationHeader.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalide.");
        }

        try {
            return backendService.currentUser(token);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalide.");
        }
    }

    protected Map<String, Object> requireAdmin(String authorizationHeader) {
        Map<String, Object> user = requireUser(authorizationHeader);
        Object role = user.get("role");
        String roleValue = role == null ? "" : String.valueOf(role).toLowerCase();
        if (!"admin".equals(roleValue) && !"administrateur".equals(roleValue)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès administrateur requis.");
        }
        return user;
    }
}
