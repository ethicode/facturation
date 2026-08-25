package com.facturation.backend.controller;

import com.facturation.backend.service.AppService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflow")
public class WorkflowController extends BaseController {
    public WorkflowController(AppService appService) {
        super(appService);
    }

    @GetMapping("/tasks")
    public List<Map<String, Object>> tasks(@RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.workflowTasks();
    }
}
