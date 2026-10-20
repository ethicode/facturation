package com.facturation.api.model;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record BudgetItemUpdateRequest(@NotNull String label, @NotNull BigDecimal allocated) {
}
