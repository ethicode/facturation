package com.facturation.api.model;

import java.math.BigDecimal;
import java.util.List;

public record ApproStateResponse(
        List<BudgetLine> budgets,
        List<SupplyTicketResponse> tickets,
        List<DirfinHistory> dirfinHistory,
        List<BudgetItemLine> budgetItems) {

    public record BudgetLine(String direction, BigDecimal allocated, BigDecimal engaged, String allocatedBy) {
    }

    public record BudgetItemLine(String id, String direction, String label, BigDecimal allocated, String createdAt,
                                 String createdBy, String updatedAt, String updatedBy) {
    }

    public record DirfinHistory(String id, String at, String actor, String action, String detail) {
    }
}
