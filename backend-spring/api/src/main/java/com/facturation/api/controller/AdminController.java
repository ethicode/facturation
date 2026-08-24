package com.facturation.api.controller;

import com.facturation.core.model.DirectionDefinition;
import com.facturation.core.model.RoleDefinition;
import com.facturation.core.model.WorkflowStepAssignment;
import com.facturation.core.service.BackendService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Administration")
public class AdminController extends BaseSecuredController {
    public AdminController(BackendService backendService) {
        super(backendService);
    }

    @GetMapping("/directions")
    public List<DirectionDefinition> listDirections(@RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.listDirections();
    }

    @PostMapping("/directions")
    public List<DirectionDefinition> createDirection(@RequestBody DirectionDefinition payload,
                                                     @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.createDirection(payload.name);
    }

    @PutMapping("/directions/{directionName}")
    public List<DirectionDefinition> updateDirection(@PathVariable String directionName,
                                                     @RequestBody DirectionDefinition payload,
                                                     @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.updateDirection(directionName, payload.name);
    }

    @DeleteMapping("/directions/{directionName}")
    public List<DirectionDefinition> deleteDirection(@PathVariable String directionName,
                                                     @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.deleteDirection(directionName);
    }

    @GetMapping("/roles")
    public List<RoleDefinition> listRoles(@RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.listRoles();
    }

    @PostMapping("/roles")
    public List<RoleDefinition> createRole(@RequestBody RoleDefinition payload,
                                           @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.createRole(payload);
    }

    @PutMapping("/roles/{roleCode}")
    public List<RoleDefinition> updateRole(@PathVariable String roleCode,
                                           @RequestBody Map<String, String> payload,
                                           @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.updateRole(roleCode, payload.getOrDefault("label", ""));
    }

    @DeleteMapping("/roles/{roleCode}")
    public List<RoleDefinition> deleteRole(@PathVariable String roleCode,
                                           @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.deleteRole(roleCode);
    }

    @GetMapping("/users")
    public List<Map<String, Object>> listUsers(@RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.listUsers();
    }

    @PostMapping("/users")
    public Map<String, Object> createUser(@RequestBody Map<String, Object> payload,
                                          @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.createUser(payload);
    }

    @PutMapping("/users/{userId}")
    public Map<String, Object> updateUser(@PathVariable String userId,
                                          @RequestBody Map<String, Object> payload,
                                          @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.updateUser(userId, payload);
    }

    @DeleteMapping("/users/{userId}")
    public boolean deleteUser(@PathVariable String userId,
                              @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.deleteUser(userId);
    }

    @GetMapping("/workflow-assignments")
    public List<WorkflowStepAssignment> listAssignments(@RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.listAssignments();
    }

    @PostMapping("/workflow-assignments")
    public WorkflowStepAssignment saveAssignment(@RequestBody Map<String, Object> payload,
                                                 @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        String step = asString(payload.get("step"), "");
        String workflowType = asString(payload.get("workflow_type"), "facturation");
        List<String> userIds = extractStringList(payload.get("user_ids"));
        return backendService.saveAssignment(step, userIds, workflowType);
    }

    @PutMapping("/workflow-assignments/{step}")
    public WorkflowStepAssignment updateAssignment(@PathVariable String step,
                                                   @RequestBody Map<String, Object> payload,
                                                   @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        String workflowType = asString(payload.get("workflow_type"), "facturation");
        List<String> userIds = extractStringList(payload.get("user_ids"));
        return backendService.saveAssignment(step, userIds, workflowType);
    }

    @DeleteMapping("/workflow-assignments/{step}")
    public List<WorkflowStepAssignment> deleteAssignment(@PathVariable String step,
                                                          @RequestParam(defaultValue = "facturation", name = "workflow_type") String workflowType,
                                                          @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return backendService.deleteAssignment(step, workflowType);
    }

    private List<String> extractStringList(Object raw) {
        if (!(raw instanceof List<?> rawList)) {
            return List.of();
        }
        return rawList.stream()
                .filter(Objects::nonNull)
                .map(String::valueOf)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private String asString(Object raw, String fallback) {
        if (raw == null) {
            return fallback;
        }
        String value = String.valueOf(raw);
        return value.isBlank() ? fallback : value;
    }
}
