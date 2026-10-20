package com.facturation.core.model.command;

import java.math.BigDecimal;

public record SupplyTicketCreateCommand(
        String direction,
        String objet,
        BigDecimal montant,
        String devise,
        String titreDemande,
        String domaine,
        String sousDomaine,
        String actionDemande,
        String dateDebutSouhaitee,
        String dateFinSouhaitee,
        String directionDemandeur,
        BigDecimal budgetPrevisionnel,
        String priorite,
        String description,
        String commentaire,
        String fichierNom,
        String actor) {
}
