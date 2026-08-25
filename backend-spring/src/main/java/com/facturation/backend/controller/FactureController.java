package com.facturation.backend.controller;

import com.facturation.backend.service.AppService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FactureController extends BaseController {
    public FactureController(AppService appService) {
        super(appService);
    }

    @GetMapping("/factures")
    public List<Map<String, Object>> listFactures(@RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.listFactures();
    }

    @GetMapping("/factures/{factureId}")
    public Map<String, Object> getFacture(@PathVariable String factureId,
                                           @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.getFacture(factureId);
    }

    @PostMapping("/factures")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createFacture(@RequestBody Map<String, Object> payload,
                                             @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.createFacture(payload);
    }

    @DeleteMapping("/factures/{factureId}")
    public List<Map<String, Object>> deleteFacture(@PathVariable String factureId,
                                                    @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.deleteFacture(factureId);
    }

    @PatchMapping("/factures/{factureId}/status")
    public Map<String, Object> updateFactureStatus(@PathVariable String factureId,
                                                    @RequestBody Map<String, Object> payload,
                                                    @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.updateFactureStatus(factureId, payload);
    }
}
