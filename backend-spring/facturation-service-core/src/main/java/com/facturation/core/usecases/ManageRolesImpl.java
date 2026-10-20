package com.facturation.core.usecases;

import com.facturation.api.model.RequestContext;
import com.facturation.api.model.RoleDefinition;
import com.facturation.api.model.RoleUpdateRequest;
import com.facturation.api.usecases.ManageRoles;
import com.facturation.core.mapper.ResponseMapper;
import com.facturation.core.service.RoleService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ManageRolesImpl implements ManageRoles {

    private final RoleService roleService;

    @Override
    public List<RoleDefinition> listRoles(RequestContext ctx) {
        return ResponseMapper.toRoleDefinitions(roleService.list());
    }

    @Override
    public List<RoleDefinition> createRole(RoleDefinition input, RequestContext ctx) {
        return ResponseMapper.toRoleDefinitions(roleService.create(input.code(), input.label()));
    }

    @Override
    public List<RoleDefinition> updateRole(String roleCode, RoleUpdateRequest input, RequestContext ctx) {
        return ResponseMapper.toRoleDefinitions(roleService.update(roleCode, input.label()));
    }

    @Override
    public List<RoleDefinition> deleteRole(String roleCode, RequestContext ctx) {
        return ResponseMapper.toRoleDefinitions(roleService.delete(roleCode));
    }
}
