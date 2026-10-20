package com.facturation.core.port;

import com.facturation.core.model.Dashboard;
import java.util.List;

public interface DashboardGateway {

    List<Dashboard.Metric> findMetrics();

    List<Dashboard.TraceEvent> findTraceEvents();

    List<Dashboard.BudgetOverview> findBudgetLines();
}
