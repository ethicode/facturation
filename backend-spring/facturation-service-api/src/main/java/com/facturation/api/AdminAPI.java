package com.facturation.api;

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
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/** Endpoints réservés aux administrateurs. */
@RequestMapping(value = "/api/admin", produces = "application/json")
public interface AdminAPI extends ManageRoles, ManageUsers, ManageDirections, ManageApproDomains, ManageWorkflowAssignments {

    @GetMapping("/roles")
    @Override
    List<RoleDefinition> listRoles(RequestContext ctx);

    @PostMapping("/roles")
    @Override
    List<RoleDefinition> createRole(@Valid @RequestBody RoleDefinition input, RequestContext ctx);

    @PutMapping("/roles/{roleCode}")
    @Override
    List<RoleDefinition> updateRole(@PathVariable("roleCode") String roleCode, @Valid @RequestBody RoleUpdateRequest input,
                                    RequestContext ctx);

    @DeleteMapping("/roles/{roleCode}")
    @Override
    List<RoleDefinition> deleteRole(@PathVariable("roleCode") String roleCode, RequestContext ctx);

    @GetMapping("/users")
    @Override
    List<AuthUserResponse> listUsers(RequestContext ctx);

    @PostMapping("/users")
    @Override
    AuthUserResponse createUser(@Valid @RequestBody UserCreateRequest input, RequestContext ctx);

    @PutMapping("/users/{userId}")
    @Override
    AuthUserResponse updateUser(@PathVariable("userId") String userId, @Valid @RequestBody UserUpdateRequest input,
                                RequestContext ctx);

    @DeleteMapping("/users/{userId}")
    @Override
    boolean deleteUser(@PathVariable("userId") String userId, RequestContext ctx);

    @GetMapping("/directions")
    @Override
    List<DirectionDefinition> listDirections(RequestContext ctx);

    @PostMapping("/directions")
    @Override
    List<DirectionDefinition> createDirection(@Valid @RequestBody DirectionDefinition input, RequestContext ctx);

    @PutMapping("/directions/{directionName}")
    @Override
    List<DirectionDefinition> updateDirection(@PathVariable("directionName") String directionName,
                                              @Valid @RequestBody DirectionDefinition input, RequestContext ctx);

    @DeleteMapping("/directions/{directionName}")
    @Override
    List<DirectionDefinition> deleteDirection(@PathVariable("directionName") String directionName, RequestContext ctx);

    @GetMapping("/appro-domains")
    @Override
    ApproDomainCatalogResponse listApproDomains(RequestContext ctx);

    @PostMapping("/appro-domains")
    @Override
    ApproDomainCatalogResponse createApproDomain(@Valid @RequestBody ApproDomainRequest input, RequestContext ctx);

    @DeleteMapping("/appro-domains/{domainName}")
    @Override
    ApproDomainCatalogResponse deleteApproDomain(@PathVariable("domainName") String domainName, RequestContext ctx);

    @PostMapping("/appro-subdomains")
    @Override
    ApproDomainCatalogResponse createApproSubdomain(@Valid @RequestBody ApproSubdomainRequest input, RequestContext ctx);

    @PutMapping("/appro-subdomains")
    @Override
    ApproDomainCatalogResponse updateApproSubdomain(@Valid @RequestBody ApproSubdomainUpdateRequest input,
                                                    RequestContext ctx);

    @DeleteMapping("/appro-subdomains")
    @Override
    ApproDomainCatalogResponse deleteApproSubdomain(@RequestParam("domain") String domainName,
                                                    @RequestParam("name") String subdomainName, RequestContext ctx);

    @GetMapping("/workflow-assignments")
    @Override
    List<WorkflowStepAssignment> listWorkflowAssignments(RequestContext ctx);

    @PostMapping("/workflow-assignments")
    @Override
    WorkflowStepAssignment saveWorkflowAssignment(@RequestBody WorkflowStepAssignment input, RequestContext ctx);

    @PutMapping("/workflow-assignments/{step}")
    @Override
    WorkflowStepAssignment updateWorkflowAssignment(@PathVariable("step") String step,
                                                    @RequestBody WorkflowStepAssignment input, RequestContext ctx);

    @DeleteMapping("/workflow-assignments/{step}")
    @Override
    List<WorkflowStepAssignment> deleteWorkflowAssignment(
            @PathVariable("step") String step,
            @RequestParam(name = "workflow_type", defaultValue = "facturation") String workflowType,
            RequestContext ctx);
}
