package com.facturation.core.model.command;

import java.math.BigDecimal;

/** Création (direction renseignée) ou modification (direction ignorée) d'une ligne budgétaire. */
public record BudgetItemCommand(String direction, String label, BigDecimal allocated, String actor) {
}
