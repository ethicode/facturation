package com.facturation.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.List;

public record MissionResponse(
        String code,
        @JsonProperty("objet_mission") String objetMission,
        String destination,
        String pays,
        @JsonProperty("date_depart") String dateDepart,
        @JsonProperty("date_retour") String dateRetour,
        @JsonProperty("montant_estimatif") String montantEstimatif,
        @JsonProperty("budget_concerne") String budgetConcerne,
        @JsonProperty("budget_item_id") String budgetItemId,
        @JsonProperty("budget_consumed") BigDecimal budgetConsumed,
        @JsonProperty("budget_consumed_at") String budgetConsumedAt,
        @JsonProperty("pieces_jointes") List<String> piecesJointes,
        String statut,
        List<HistoryEntryResponse> history) {
}
