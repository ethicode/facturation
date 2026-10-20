package com.facturation.gateway.outbound.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "missions")
public class MissionEntity {

    @Id
    private String code;

    @Column(name = "objet_mission", nullable = false)
    private String objetMission;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private String pays;

    @Column(name = "date_depart", nullable = false)
    private String dateDepart;

    @Column(name = "date_retour", nullable = false)
    private String dateRetour;

    @Column(name = "montant_estimatif", nullable = false, precision = 19, scale = 2)
    private BigDecimal montantEstimatif;

    @Column(name = "budget_concerne", nullable = false)
    private String budgetConcerne = "";

    /** Clé étrangère vers appro_budget_items(id). */
    @Column(name = "budget_item_id")
    private String budgetItemId;

    @Column(name = "budget_consumed", nullable = false, precision = 19, scale = 2)
    private BigDecimal budgetConsumed = BigDecimal.ZERO;

    @Column(name = "budget_consumed_at")
    private Instant budgetConsumedAt;

    @Column(nullable = false)
    private String statut;

    @Column(nullable = false)
    private int position;

    @ElementCollection
    @CollectionTable(name = "mission_attachments", joinColumns = @JoinColumn(name = "mission_code"))
    @OrderColumn(name = "position")
    @Column(name = "filename", nullable = false)
    private List<String> piecesJointes = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "mission_code", nullable = false)
    @OrderColumn(name = "position")
    private List<MissionHistoryEntity> history = new ArrayList<>();
}
