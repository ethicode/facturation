package com.facturation.gateway.outbound.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "budget_lines")
public class BudgetLineEntity {

    @Id
    private String poste;

    @Column(nullable = false)
    private int consomme;

    @Column(nullable = false)
    private String plafond = "";

    @Column(nullable = false)
    private String tendance = "";

    @Column(nullable = false)
    private int position;
}
