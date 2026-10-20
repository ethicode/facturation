package com.facturation.api.model;

import jakarta.validation.constraints.NotNull;

public record RoleUpdateRequest(@NotNull String label) {
}
