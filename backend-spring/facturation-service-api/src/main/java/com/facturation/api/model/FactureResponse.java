package com.facturation.api.model;

import java.math.BigDecimal;
import java.util.List;

public record FactureResponse(
        String id,
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
        String statut,
        List<HistoryEntryResponse> history) {
}
