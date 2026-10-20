package com.facturation.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record FactureStatusRequest(
        @NotNull @JsonProperty("next_status") String nextStatus,
        String actor,
        String email,
        String role,
        @JsonProperty("action_label") String actionLabel,
        String commentaire,
        List<String> piecesJointes) {
}
