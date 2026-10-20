package com.facturation.gateway.outbound.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "appro_tickets")
public class SupplyTicketEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String direction = "";

    @Column(nullable = false)
    private String objet = "";

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal montant = BigDecimal.ZERO;

    @Column(nullable = false)
    private String devise = "XAF";

    @Column(name = "titre_demande", nullable = false)
    private String titreDemande = "";

    @Column(nullable = false)
    private String domaine = "";

    @Column(name = "sous_domaine", nullable = false)
    private String sousDomaine = "";

    @Column(name = "action_demande", nullable = false)
    private String actionDemande = "";

    @Column(name = "date_debut_souhaitee", nullable = false)
    private String dateDebutSouhaitee = "";

    @Column(name = "date_fin_souhaitee", nullable = false)
    private String dateFinSouhaitee = "";

    @Column(name = "direction_demandeur", nullable = false)
    private String directionDemandeur = "";

    @Column(name = "budget_previsionnel", nullable = false, precision = 19, scale = 2)
    private BigDecimal budgetPrevisionnel = BigDecimal.ZERO;

    @Column(nullable = false)
    private String priorite = "";

    @Column(nullable = false)
    private String description = "";

    @Column(nullable = false)
    private String commentaire = "";

    @Column(name = "fichier_nom", nullable = false)
    private String fichierNom = "";

    @Column(nullable = false)
    private String statut;

    @Column(name = "linked_facture_id", nullable = false)
    private String linkedFactureId = "";

    @Column(nullable = false)
    private int position;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "ticket_id", nullable = false)
    @OrderColumn(name = "position")
    private List<SupplyTicketHistoryEntity> history = new ArrayList<>();
}
