package com.facturation.core.model;

import java.util.List;

public record ApproState(
        List<BudgetDirection> budgets,
        List<SupplyTicket> tickets,
        List<DirfinHistoryEntry> dirfinHistory,
        List<BudgetItem> budgetItems) {
}
