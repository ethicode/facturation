package com.facturation.api.usecases;

import com.facturation.api.model.RequestContext;
import com.facturation.api.model.RoleDefinition;
import com.facturation.api.model.RoleUpdateRequest;
import java.util.List;

public interface ManageRoles {

    List<RoleDefinition> listRoles(RequestContext ctx);

    List<RoleDefinition> createRole(RoleDefinition input, RequestContext ctx);

    List<RoleDefinition> updateRole(String roleCode, RoleUpdateRequest input, RequestContext ctx);

    List<RoleDefinition> deleteRole(String roleCode, RequestContext ctx);
}
