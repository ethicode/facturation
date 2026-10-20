package com.facturation.gateway.outbound.entity;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/** Colonnes communes des tables d'historique (facture, ticket, mission). */
@Getter
@Setter
@MappedSuperclass
public abstract class HistoryEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_at", nullable = false)
    private Instant eventAt;

    @Column(nullable = false)
    private String actor;

    private String email;

    @Column(nullable = false)
    private String action;

    private String role;

    private String detail;

    @Column(nullable = false)
    private String commentaire = "";
}
