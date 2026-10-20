package com.facturation.core.model;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetDirection {
    private String direction;
    private BigDecimal allocated;
    private BigDecimal engaged;
    private String allocatedBy;
}
