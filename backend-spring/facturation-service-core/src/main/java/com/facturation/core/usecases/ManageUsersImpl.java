package com.facturation.core.usecases;

import com.facturation.api.model.AuthUserResponse;
import com.facturation.api.model.RequestContext;
import com.facturation.api.model.UserCreateRequest;
import com.facturation.api.model.UserUpdateRequest;
import com.facturation.api.usecases.ManageUsers;
import com.facturation.core.mapper.CommandMapper;
import com.facturation.core.mapper.ResponseMapper;
import com.facturation.core.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ManageUsersImpl implements ManageUsers {

    private final UserService userService;

    @Override
    public List<AuthUserResponse> listUsers(RequestContext ctx) {
        return userService.list().stream().map(ResponseMapper::toResponse).toList();
    }

    @Override
    public AuthUserResponse createUser(UserCreateRequest input, RequestContext ctx) {
        return ResponseMapper.toResponse(userService.create(CommandMapper.toCommand(input)));
    }

    @Override
    public AuthUserResponse updateUser(String userId, UserUpdateRequest input, RequestContext ctx) {
        return ResponseMapper.toResponse(userService.update(userId, CommandMapper.toCommand(input)));
    }

    @Override
    public boolean deleteUser(String userId, RequestContext ctx) {
        userService.delete(userId);
        return true;
    }
}
