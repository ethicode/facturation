package com.facturation.api.controller;

import com.facturation.core.service.BackendService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Auth")
public class AuthController extends BaseSecuredController {
    public AuthController(BackendService backendService) {
        super(backendService);
    }

    @PostMapping("/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, String> payload) {
        return backendService.login(payload.getOrDefault("username", ""), payload.getOrDefault("password", ""));
    }

    @GetMapping("/auth/me")
    public Map<String, Object> me(@RequestHeader(name = "Authorization", required = false) String authorization) {
        return requireUser(authorization);
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(@RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.dashboard();
    }

    @GetMapping("/meta/workflow")
    public Map<String, Object> workflowMeta(@RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.workflowMeta();
    }
}
