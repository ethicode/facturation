package com.facturation.gateway.outbound.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "appro_budgets")
public class BudgetDirectionEntity {

    @Id
    private String direction;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal allocated = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal engaged = BigDecimal.ZERO;

    @Column(name = "allocated_by", nullable = false)
    private String allocatedBy = "";

    @Column(nullable = false)
    private int position;
}
