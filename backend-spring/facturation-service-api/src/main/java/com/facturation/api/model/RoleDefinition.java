package com.facturation.api.model;

import jakarta.validation.constraints.NotNull;

public record RoleDefinition(@NotNull String code, @NotNull String label) {
}
