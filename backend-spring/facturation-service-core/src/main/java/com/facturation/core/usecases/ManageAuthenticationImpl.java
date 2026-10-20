package com.facturation.core.usecases;

import com.facturation.api.model.AuthUserResponse;
import com.facturation.api.model.LoginRequest;
import com.facturation.api.model.RequestContext;
import com.facturation.api.model.TokenResponse;
import com.facturation.api.usecases.ManageAuthentication;
import com.facturation.core.mapper.ResponseMapper;
import com.facturation.core.model.AuthSession;
import com.facturation.core.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ManageAuthenticationImpl implements ManageAuthentication {

    private final AuthService authService;

    @Override
    public TokenResponse login(LoginRequest input) {
        AuthSession session = authService.login(input.username(), input.password());
        return new TokenResponse(session.accessToken(), "bearer", ResponseMapper.toResponse(session.user()));
    }

    @Override
    public AuthUserResponse me(RequestContext ctx) {
        return ResponseMapper.toResponse(authService.currentUser(ctx.userId()));
    }
}
