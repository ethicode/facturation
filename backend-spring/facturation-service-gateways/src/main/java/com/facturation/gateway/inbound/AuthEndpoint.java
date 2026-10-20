package com.facturation.gateway.inbound;

import com.facturation.api.AuthAPI;
import com.facturation.api.model.AuthUserResponse;
import com.facturation.api.model.DashboardResponse;
import com.facturation.api.model.HealthResponse;
import com.facturation.api.model.LoginRequest;
import com.facturation.api.model.RequestContext;
import com.facturation.api.model.TokenResponse;
import com.facturation.api.usecases.GetDashboard;
import com.facturation.api.usecases.ManageAuthentication;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AuthEndpoint implements AuthAPI {

    private final ManageAuthentication manageAuthentication;
    private final GetDashboard getDashboard;

    @Override
    public HealthResponse health() {
        return new HealthResponse("ok");
    }

    @Override
    public TokenResponse login(LoginRequest input) {
        return manageAuthentication.login(input);
    }

    @Override
    public AuthUserResponse me(RequestContext ctx) {
        return manageAuthentication.me(ctx);
    }

    @Override
    public DashboardResponse dashboard(RequestContext ctx) {
        return getDashboard.dashboard(ctx);
    }
}
