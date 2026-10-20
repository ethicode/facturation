package com.facturation.core.service;

import com.facturation.core.model.Dashboard;
import com.facturation.core.port.DashboardGateway;
import com.facturation.core.port.MissionGateway;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final DashboardGateway dashboardGateway;
    private final MissionGateway missionGateway;

    public Dashboard get() {
        return new Dashboard(
                dashboardGateway.findMetrics(),
                missionGateway.findAll(),
                dashboardGateway.findTraceEvents(),
                dashboardGateway.findBudgetLines());
    }
}
