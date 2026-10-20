package com.facturation.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record DashboardResponse(
        @JsonProperty("kpi_metrics") List<Metric> kpiMetrics,
        List<MissionResponse> missions,
        @JsonProperty("trace_events") List<TraceEvent> traceEvents,
        @JsonProperty("budget_lines") List<BudgetOverview> budgetLines) {

    public record Metric(String label, String value, String trend, String tone) {
    }

    public record TraceEvent(String date, String action, String actor) {
    }

    public record BudgetOverview(String poste, int consomme, String plafond, String tendance) {
    }
}
