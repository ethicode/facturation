package com.facturation.backend.controller;

import com.facturation.backend.service.AppService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/admin")
public class AdminController extends BaseController {
    public AdminController(AppService appService) {
        super(appService);
    }

    @GetMapping("/directions")
    public List<Map<String, Object>> listDirections(@RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.listDirections();
    }

    @PostMapping("/directions")
    public List<Map<String, Object>> createDirection(@RequestBody Map<String, String> payload,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.createDirection(payload.getOrDefault("name", ""));
    }

    @PutMapping("/directions/{directionName}")
    public List<Map<String, Object>> updateDirection(@PathVariable String directionName,
                                                     @RequestBody Map<String, String> payload,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.updateDirection(directionName, payload.getOrDefault("name", ""));
    }

    @DeleteMapping("/directions/{directionName}")
    public List<Map<String, Object>> deleteDirection(@PathVariable String directionName,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.deleteDirection(directionName);
    }

    @GetMapping("/roles")
    public List<Map<String, Object>> listRoles(@RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.listRoles();
    }

    @PostMapping("/roles")
    public List<Map<String, Object>> createRole(@RequestBody Map<String, Object> payload,
                                                @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.createRole(payload);
    }

    @PutMapping("/roles/{roleCode}")
    public List<Map<String, Object>> updateRole(@PathVariable String roleCode,
                                                @RequestBody Map<String, String> payload,
                                                @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.updateRole(roleCode, payload.getOrDefault("label", ""));
    }

    @DeleteMapping("/roles/{roleCode}")
    public List<Map<String, Object>> deleteRole(@PathVariable String roleCode,
                                                @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.deleteRole(roleCode);
    }

    @GetMapping("/users")
    public List<Map<String, Object>> listUsers(@RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.listUsers();
    }

    @PostMapping("/users")
    public Map<String, Object> createUser(@RequestBody Map<String, Object> payload,
                                          @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.createUser(payload);
    }

    @PutMapping("/users/{userId}")
    public Map<String, Object> updateUser(@PathVariable String userId,
                                          @RequestBody Map<String, Object> payload,
                                          @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.updateUser(userId, payload);
    }

    @DeleteMapping("/users/{userId}")
    public boolean deleteUser(@PathVariable String userId,
                              @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.deleteUser(userId);
    }

    @GetMapping("/workflow-assignments")
    public List<Map<String, Object>> listWorkflowAssignments(@RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.listAssignments();
    }

    @PostMapping("/workflow-assignments")
    public Map<String, Object> saveWorkflowAssignment(@RequestBody Map<String, Object> payload,
                                                      @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.saveAssignment(
                String.valueOf(payload.getOrDefault("step", "")),
                String.valueOf(payload.getOrDefault("workflow_type", "facturation")),
                extractUserIds(payload.get("user_ids"))
        );
    }

    @PutMapping("/workflow-assignments/{step}")
    public Map<String, Object> updateWorkflowAssignment(@PathVariable String step,
                                                        @RequestBody Map<String, Object> payload,
                                                        @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.saveAssignment(
                step,
                String.valueOf(payload.getOrDefault("workflow_type", "facturation")),
                extractUserIds(payload.get("user_ids"))
        );
    }

    @DeleteMapping("/workflow-assignments/{step}")
    public List<Map<String, Object>> deleteWorkflowAssignment(@PathVariable String step,
                                                              @RequestParam(name = "workflow_type", defaultValue = "facturation") String workflowType,
                                                              @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(authorization);
        return appService.deleteAssignment(step, workflowType);
    }

    private List<String> extractUserIds(Object raw) {
        if (!(raw instanceof List<?> list)) {
            return List.of();
        }
        return list.stream().filter(Objects::nonNull).map(String::valueOf).toList();
    }
}
