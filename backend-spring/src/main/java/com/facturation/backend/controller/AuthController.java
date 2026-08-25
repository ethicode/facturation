package com.facturation.backend.controller;

import com.facturation.backend.service.AppService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController extends BaseController {
    public AuthController(AppService appService) {
        super(appService);
    }

    @PostMapping("/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, String> payload) {
        return appService.login(payload.getOrDefault("username", ""), payload.getOrDefault("password", ""));
    }

    @GetMapping("/auth/me")
    public Map<String, Object> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return requireUser(authorization);
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(@RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.dashboard();
    }

    @GetMapping("/meta/workflow")
    public Map<String, Object> workflowMeta(@RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.workflowMeta();
    }
}
