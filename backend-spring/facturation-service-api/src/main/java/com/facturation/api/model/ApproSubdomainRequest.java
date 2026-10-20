package com.facturation.api.model;

import jakarta.validation.constraints.NotNull;

public record ApproSubdomainRequest(@NotNull String domain, @NotNull String name) {
}
