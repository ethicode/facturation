package com.facturation.api.controller;

import com.facturation.core.service.BackendService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Tag(name = "Health")
public class HealthController {
    private final BackendService backendService;

    public HealthController(BackendService backendService) {
        this.backendService = backendService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return backendService.health();
    }
}
