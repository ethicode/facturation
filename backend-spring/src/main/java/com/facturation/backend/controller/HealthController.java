package com.facturation.backend.controller;

import com.facturation.backend.service.AppService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {
    private final AppService appService;

    public HealthController(AppService appService) {
        this.appService = appService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return appService.health();
    }
}
