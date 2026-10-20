package com.facturation.api;

import com.facturation.api.model.AuthUserResponse;
import com.facturation.api.model.DashboardResponse;
import com.facturation.api.model.HealthResponse;
import com.facturation.api.model.LoginRequest;
import com.facturation.api.model.RequestContext;
import com.facturation.api.model.TokenResponse;
import com.facturation.api.usecases.GetDashboard;
import com.facturation.api.usecases.ManageAuthentication;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping(produces = "application/json")
public interface AuthAPI extends ManageAuthentication, GetDashboard {

    @GetMapping("/health")
    HealthResponse health();

    @PostMapping("/api/auth/login")
    @Override
    TokenResponse login(@Valid @RequestBody LoginRequest input);

    @GetMapping("/api/auth/me")
    @Override
    AuthUserResponse me(RequestContext ctx);

    @GetMapping("/api/dashboard")
    @Override
    DashboardResponse dashboard(RequestContext ctx);
}
