package com.facturation.core.model;

import java.util.Arrays;
import java.util.Locale;

public enum UserStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED,
    LOCKED;

    public String code() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static UserStatus fromCode(String code) {
        return Arrays.stream(values())
                .filter(status -> status.code().equalsIgnoreCase(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Statut utilisateur inconnu: " + code));
    }
}
