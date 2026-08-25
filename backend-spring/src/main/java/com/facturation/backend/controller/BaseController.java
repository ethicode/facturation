package com.facturation.backend.controller;

import com.facturation.backend.service.AppService;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

public abstract class BaseController {
    protected final AppService appService;

    protected BaseController(AppService appService) {
        this.appService = appService;
    }

    protected Map<String, Object> requireUser(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token manquant.");
        }
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalide.");
        }
        try {
            return appService.me(token);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalide.");
        }
    }

    protected Map<String, Object> requireAdmin(String authorization) {
        Map<String, Object> user = requireUser(authorization);
        String role = String.valueOf(user.getOrDefault("role", "")).toLowerCase();
        if (!"admin".equals(role) && !"administrateur".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès administrateur requis.");
        }
        return user;
    }
}
