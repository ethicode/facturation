package com.facturation.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.List;

public record SupplyTicketResponse(
        String id,
        String direction,
        String objet,
        BigDecimal montant,
        String devise,
        @JsonProperty("titre_demande") String titreDemande,
        String domaine,
        @JsonProperty("sous_domaine") String sousDomaine,
        @JsonProperty("action_demande") String actionDemande,
        @JsonProperty("date_debut_souhaitee") String dateDebutSouhaitee,
        @JsonProperty("date_fin_souhaitee") String dateFinSouhaitee,
        @JsonProperty("direction_demandeur") String directionDemandeur,
        @JsonProperty("budget_previsionnel") BigDecimal budgetPrevisionnel,
        String priorite,
        String description,
        String commentaire,
        @JsonProperty("fichier_nom") String fichierNom,
        String statut,
        String linkedFactureId,
        List<HistoryEntryResponse> history) {
}
