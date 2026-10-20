package com.facturation.core.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplyTicket {
    private String id;
    private String direction;
    private String objet;
    private BigDecimal montant;
    private String devise;
    @Builder.Default
    private String titreDemande = "";
    @Builder.Default
    private String domaine = "";
    @Builder.Default
    private String sousDomaine = "";
    @Builder.Default
    private String actionDemande = "";
    @Builder.Default
    private String dateDebutSouhaitee = "";
    @Builder.Default
    private String dateFinSouhaitee = "";
    @Builder.Default
    private String directionDemandeur = "";
    @Builder.Default
    private BigDecimal budgetPrevisionnel = BigDecimal.ZERO;
    @Builder.Default
    private String priorite = "";
    @Builder.Default
    private String description = "";
    @Builder.Default
    private String commentaire = "";
    @Builder.Default
    private String fichierNom = "";
    private String statut;
    @Builder.Default
    private String linkedFactureId = "";
    @Builder.Default
    private List<HistoryEntry> history = new ArrayList<>();
}
