package com.facturation.core.model;

import java.util.List;

public record Dashboard(
        List<Metric> kpiMetrics,
        List<Mission> missions,
        List<TraceEvent> traceEvents,
        List<BudgetOverview> budgetLines) {

    public record Metric(String label, String value, String trend, String tone) {
    }

    public record TraceEvent(String date, String action, String actor) {
    }

    public record BudgetOverview(String poste, int consomme, String plafond, String tendance) {
    }
}
