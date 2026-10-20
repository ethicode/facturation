package com.facturation.core.model.command;

import java.math.BigDecimal;
import java.util.List;

public record FactureCreateCommand(
        String fournisseur,
        BigDecimal montant,
        String devise,
        String centreCout,
        String description,
        String echeance,
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
