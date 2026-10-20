package com.facturation.api.usecases;

import com.facturation.api.model.AuthUserResponse;
import com.facturation.api.model.LoginRequest;
import com.facturation.api.model.RequestContext;
import com.facturation.api.model.TokenResponse;

public interface ManageAuthentication {

    TokenResponse login(LoginRequest input);

    AuthUserResponse me(RequestContext ctx);
}
