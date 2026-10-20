package com.facturation.api.model;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record FactureCreateRequest(
        @NotNull String fournisseur,
        @NotNull BigDecimal montant,
        String devise,
        @NotNull String centreCout,
        @NotNull String description,
        @NotNull String echeance,
        String priorite,
        String direction,
        String resume,
        String numeroFacture,
        String compteCharge,
        String dateReception,
        String modeReception,
        List<String> piecesJointes,
        String actor,
        String email,
        String role) {
}
