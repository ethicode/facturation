package com.facturation.core.model.command;

import java.math.BigDecimal;

public record BudgetUpsertCommand(
        String direction,
        BigDecimal allocated,
        BigDecimal engaged,
        String allocatedBy,
        String actor) {
}
