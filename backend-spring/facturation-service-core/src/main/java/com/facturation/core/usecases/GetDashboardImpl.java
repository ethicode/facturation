package com.facturation.core.usecases;

import com.facturation.api.model.DashboardResponse;
import com.facturation.api.model.RequestContext;
import com.facturation.api.usecases.GetDashboard;
import com.facturation.core.mapper.ResponseMapper;
import com.facturation.core.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetDashboardImpl implements GetDashboard {

    private final DashboardService dashboardService;

    @Override
    public DashboardResponse dashboard(RequestContext ctx) {
        return ResponseMapper.toResponse(dashboardService.get());
    }
}
