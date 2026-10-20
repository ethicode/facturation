package com.facturation.gateway.outbound.adapter;

import com.facturation.core.model.Dashboard;
import com.facturation.core.port.DashboardGateway;
import com.facturation.gateway.outbound.repository.BudgetLineRepository;
import com.facturation.gateway.outbound.repository.KpiMetricRepository;
import com.facturation.gateway.outbound.repository.TraceEventRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DashboardGatewayAdapter implements DashboardGateway {

    private final KpiMetricRepository metricRepository;
    private final TraceEventRepository traceEventRepository;
    private final BudgetLineRepository budgetLineRepository;

    @Override
    public List<Dashboard.Metric> findMetrics() {
        return metricRepository.findAllByOrderByPositionAsc().stream()
                .map(entity -> new Dashboard.Metric(entity.getLabel(), entity.getValue(), entity.getTrend(), entity.getTone()))
                .toList();
    }

    @Override
    public List<Dashboard.TraceEvent> findTraceEvents() {
        return traceEventRepository.findAllByOrderByPositionAsc().stream()
                .map(entity -> new Dashboard.TraceEvent(entity.getEventDate(), entity.getAction(), entity.getActor()))
                .toList();
    }

    @Override
    public List<Dashboard.BudgetOverview> findBudgetLines() {
        return budgetLineRepository.findAllByOrderByPositionAsc().stream()
                .map(entity -> new Dashboard.BudgetOverview(entity.getPoste(), entity.getConsomme(), entity.getPlafond(),
                        entity.getTendance()))
                .toList();
    }
}
