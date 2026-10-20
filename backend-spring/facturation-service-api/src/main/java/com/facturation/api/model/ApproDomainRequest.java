package com.facturation.api.model;

import jakarta.validation.constraints.NotNull;

public record ApproDomainRequest(@NotNull String name) {
}
