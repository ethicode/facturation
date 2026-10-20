package com.facturation.api.usecases;

import com.facturation.api.model.DashboardResponse;
import com.facturation.api.model.RequestContext;

public interface GetDashboard {

    DashboardResponse dashboard(RequestContext ctx);
}
