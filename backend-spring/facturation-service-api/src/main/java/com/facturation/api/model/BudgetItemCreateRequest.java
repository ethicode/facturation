package com.facturation.api.model;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record BudgetItemCreateRequest(@NotNull String direction, @NotNull String label, @NotNull BigDecimal allocated) {
}
