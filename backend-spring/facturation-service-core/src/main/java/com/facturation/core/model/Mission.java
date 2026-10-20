package com.facturation.core.model;

import java.math.BigDecimal;
import java.time.Instant;
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
public class Mission {
    private String code;
    private String objetMission;
    private String destination;
    private String pays;
    private String dateDepart;
    private String dateRetour;
    private BigDecimal montantEstimatif;
    private String budgetConcerne;
    /** Null lorsque la mission n'est rattachée à aucune ligne budgétaire. */
    private String budgetItemId;
    @Builder.Default
    private BigDecimal budgetConsumed = BigDecimal.ZERO;
    private Instant budgetConsumedAt;
    @Builder.Default
    private List<String> piecesJointes = new ArrayList<>();
    private String statut;
    @Builder.Default
    private List<HistoryEntry> history = new ArrayList<>();
}
