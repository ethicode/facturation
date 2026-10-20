package com.facturation.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public record ApproSubdomainUpdateRequest(
        @NotNull String domain,
        @NotNull @JsonProperty("current_name") String currentName,
        @NotNull @JsonProperty("next_name") String nextName) {
}
