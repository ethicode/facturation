package com.facturation.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record MissionCreateRequest(
        String code,
        @NotNull @JsonProperty("objet_mission") String objetMission,
        @NotNull String destination,
        @NotNull String pays,
        @NotNull @JsonProperty("date_depart") String dateDepart,
        @NotNull @JsonProperty("date_retour") String dateRetour,
        @NotNull @JsonProperty("montant_estimatif") String montantEstimatif,
        @NotNull @JsonProperty("budget_concerne") String budgetConcerne,
        @JsonProperty("budget_item_id") String budgetItemId,
        @JsonProperty("pieces_jointes") List<String> piecesJointes,
        String statut) {
}
