package com.facturation.core.model.command;

import java.util.List;

public record MissionCreateCommand(
        String code,
        String objetMission,
        String destination,
        String pays,
        String dateDepart,
        String dateRetour,
        String montantEstimatif,
        String budgetConcerne,
        String budgetItemId,
        List<String> piecesJointes,
        String statut) {
}
