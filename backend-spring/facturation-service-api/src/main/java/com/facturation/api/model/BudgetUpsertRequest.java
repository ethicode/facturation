package com.facturation.api.model;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record BudgetUpsertRequest(
        @NotNull String direction,
        @NotNull BigDecimal allocated,
        @NotNull BigDecimal engaged,
        String allocatedBy,
        String actor) {
}
