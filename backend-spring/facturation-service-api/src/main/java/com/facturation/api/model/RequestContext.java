package com.facturation.api.model;

import java.util.List;

/** Utilisateur authentifié à l'origine de la requête. */
public record RequestContext(String userId, String username, String email, String role, List<String> roles) {
}
