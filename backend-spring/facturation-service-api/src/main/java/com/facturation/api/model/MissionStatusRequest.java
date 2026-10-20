package com.facturation.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public record MissionStatusRequest(
        @NotNull @JsonProperty("next_status") String nextStatus,
        @JsonProperty("expected_status") String expectedStatus) {
}
