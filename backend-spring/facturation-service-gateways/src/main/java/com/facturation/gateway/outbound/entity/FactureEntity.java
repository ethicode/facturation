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
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "factures")
public class FactureEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String fournisseur;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal montant;

    @Column(nullable = false)
    private String devise;

    @Column(name = "centre_cout", nullable = false)
    private String centreCout;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String echeance;

    @Column(nullable = false)
    private String priorite = "";

    @Column(nullable = false)
    private String direction = "";

    @Column(nullable = false)
    private String resume = "";

    @Column(name = "numero_facture", nullable = false)
    private String numeroFacture = "";

    @Column(name = "compte_charge", nullable = false)
    private String compteCharge = "";

    @Column(name = "date_reception", nullable = false)
    private String dateReception = "";

    @Column(name = "mode_reception", nullable = false)
    private String modeReception = "";

    @Column(nullable = false)
    private String statut;

    @Column(nullable = false)
    private int position;

    @ElementCollection
    @CollectionTable(name = "facture_attachments", joinColumns = @JoinColumn(name = "facture_id"))
    @OrderColumn(name = "position")
    @Column(name = "filename", nullable = false)
    private List<String> piecesJointes = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "facture_id", nullable = false)
    @OrderColumn(name = "position")
    private List<FactureHistoryEntity> history = new ArrayList<>();
}
