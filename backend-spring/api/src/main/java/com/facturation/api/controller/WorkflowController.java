package com.facturation.api.controller;

import com.facturation.core.service.BackendService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflow")
@Tag(name = "Workflow")
public class WorkflowController extends BaseSecuredController {
    public WorkflowController(BackendService backendService) {
        super(backendService);
    }

    @GetMapping("/tasks")
    public List<Map<String, Object>> tasks(@RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.workflowTasks();
    }
}
