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
public class Facture {
    private String id;
    private String fournisseur;
    private BigDecimal montant;
    private String devise;
    private String centreCout;
    private String description;
    private String echeance;
    @Builder.Default
    private String priorite = "";
    @Builder.Default
    private String direction = "";
    @Builder.Default
    private String resume = "";
    @Builder.Default
    private String numeroFacture = "";
    @Builder.Default
    private String compteCharge = "";
    @Builder.Default
    private String dateReception = "";
    @Builder.Default
    private String modeReception = "";
    @Builder.Default
    private List<String> piecesJointes = new ArrayList<>();
    private String statut;
    /** Ordre antéchronologique : l'entrée la plus récente est en tête. */
    @Builder.Default
    private List<HistoryEntry> history = new ArrayList<>();
}
