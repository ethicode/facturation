package com.facturation.gateway.inbound;

import com.facturation.api.AdminAPI;
import com.facturation.api.model.ApproDomainCatalogResponse;
import com.facturation.api.model.ApproDomainRequest;
import com.facturation.api.model.ApproSubdomainRequest;
import com.facturation.api.model.ApproSubdomainUpdateRequest;
import com.facturation.api.model.AuthUserResponse;
import com.facturation.api.model.DirectionDefinition;
import com.facturation.api.model.RequestContext;
import com.facturation.api.model.RoleDefinition;
import com.facturation.api.model.RoleUpdateRequest;
import com.facturation.api.model.UserCreateRequest;
import com.facturation.api.model.UserUpdateRequest;
import com.facturation.api.model.WorkflowStepAssignment;
import com.facturation.api.usecases.ManageApproDomains;
import com.facturation.api.usecases.ManageDirections;
import com.facturation.api.usecases.ManageRoles;
import com.facturation.api.usecases.ManageUsers;
import com.facturation.api.usecases.ManageWorkflowAssignments;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AdminEndpoint implements AdminAPI {

    private final ManageRoles manageRoles;
    private final ManageUsers manageUsers;
    private final ManageDirections manageDirections;
    private final ManageApproDomains manageApproDomains;
    private final ManageWorkflowAssignments manageWorkflowAssignments;

    @Override
    public List<RoleDefinition> listRoles(RequestContext ctx) {
        return manageRoles.listRoles(ctx);
    }

    @Override
    public List<RoleDefinition> createRole(RoleDefinition input, RequestContext ctx) {
        return manageRoles.createRole(input, ctx);
    }

    @Override
    public List<RoleDefinition> updateRole(String roleCode, RoleUpdateRequest input, RequestContext ctx) {
        return manageRoles.updateRole(roleCode, input, ctx);
    }

    @Override
    public List<RoleDefinition> deleteRole(String roleCode, RequestContext ctx) {
        return manageRoles.deleteRole(roleCode, ctx);
    }

    @Override
    public List<AuthUserResponse> listUsers(RequestContext ctx) {
        return manageUsers.listUsers(ctx);
    }

    @Override
    public AuthUserResponse createUser(UserCreateRequest input, RequestContext ctx) {
        return manageUsers.createUser(input, ctx);
    }

    @Override
    public AuthUserResponse updateUser(String userId, UserUpdateRequest input, RequestContext ctx) {
        return manageUsers.updateUser(userId, input, ctx);
    }

    @Override
    public boolean deleteUser(String userId, RequestContext ctx) {
        return manageUsers.deleteUser(userId, ctx);
    }

    @Override
    public List<DirectionDefinition> listDirections(RequestContext ctx) {
        return manageDirections.listDirections(ctx);
    }

    @Override
    public List<DirectionDefinition> createDirection(DirectionDefinition input, RequestContext ctx) {
        return manageDirections.createDirection(input, ctx);
    }

    @Override
    public List<DirectionDefinition> updateDirection(String directionName, DirectionDefinition input,
                                                     RequestContext ctx) {
        return manageDirections.updateDirection(directionName, input, ctx);
    }

    @Override
    public List<DirectionDefinition> deleteDirection(String directionName, RequestContext ctx) {
        return manageDirections.deleteDirection(directionName, ctx);
    }

    @Override
    public ApproDomainCatalogResponse listApproDomains(RequestContext ctx) {
        return manageApproDomains.listApproDomains(ctx);
    }

    @Override
    public ApproDomainCatalogResponse createApproDomain(ApproDomainRequest input, RequestContext ctx) {
        return manageApproDomains.createApproDomain(input, ctx);
    }

    @Override
    public ApproDomainCatalogResponse deleteApproDomain(String domainName, RequestContext ctx) {
        return manageApproDomains.deleteApproDomain(domainName, ctx);
    }

    @Override
    public ApproDomainCatalogResponse createApproSubdomain(ApproSubdomainRequest input, RequestContext ctx) {
        return manageApproDomains.createApproSubdomain(input, ctx);
    }

    @Override
    public ApproDomainCatalogResponse updateApproSubdomain(ApproSubdomainUpdateRequest input, RequestContext ctx) {
        return manageApproDomains.updateApproSubdomain(input, ctx);
    }

    @Override
    public ApproDomainCatalogResponse deleteApproSubdomain(String domainName, String subdomainName,
                                                           RequestContext ctx) {
        return manageApproDomains.deleteApproSubdomain(domainName, subdomainName, ctx);
    }

    @Override
    public List<WorkflowStepAssignment> listWorkflowAssignments(RequestContext ctx) {
        return manageWorkflowAssignments.listWorkflowAssignments(ctx);
    }

    @Override
    public WorkflowStepAssignment saveWorkflowAssignment(WorkflowStepAssignment input, RequestContext ctx) {
        return manageWorkflowAssignments.saveWorkflowAssignment(input, ctx);
    }

    @Override
    public WorkflowStepAssignment updateWorkflowAssignment(String step, WorkflowStepAssignment input,
                                                           RequestContext ctx) {
        return manageWorkflowAssignments.updateWorkflowAssignment(step, input, ctx);
    }

    @Override
    public List<WorkflowStepAssignment> deleteWorkflowAssignment(String step, String workflowType, RequestContext ctx) {
        return manageWorkflowAssignments.deleteWorkflowAssignment(step, workflowType, ctx);
    }
}
