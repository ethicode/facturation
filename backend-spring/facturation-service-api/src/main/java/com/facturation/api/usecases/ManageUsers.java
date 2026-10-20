package com.facturation.api.usecases;

import com.facturation.api.model.AuthUserResponse;
import com.facturation.api.model.RequestContext;
import com.facturation.api.model.UserCreateRequest;
import com.facturation.api.model.UserUpdateRequest;
import java.util.List;

public interface ManageUsers {

    List<AuthUserResponse> listUsers(RequestContext ctx);

    AuthUserResponse createUser(UserCreateRequest input, RequestContext ctx);

    AuthUserResponse updateUser(String userId, UserUpdateRequest input, RequestContext ctx);

    boolean deleteUser(String userId, RequestContext ctx);
}
