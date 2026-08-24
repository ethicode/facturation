package com.facturation.api.controller;

import com.facturation.core.model.FactureRecord;
import com.facturation.core.service.BackendService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Factures")
public class FactureController extends BaseSecuredController {
    public FactureController(BackendService backendService) {
        super(backendService);
    }

    @GetMapping("/factures")
    public List<FactureRecord> listFactures(@RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.listFactures();
    }

    @GetMapping("/factures/{factureId}")
    public FactureRecord getFacture(@PathVariable String factureId,
                                    @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.getFacture(factureId);
    }

    @PostMapping("/factures")
    @ResponseStatus(HttpStatus.CREATED)
    public FactureRecord createFacture(@RequestBody Map<String, Object> payload,
                                       @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.createFacture(payload);
    }

    @DeleteMapping("/factures/{factureId}")
    public List<FactureRecord> deleteFacture(@PathVariable String factureId,
                                             @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.deleteFacture(factureId);
    }

    @PatchMapping("/factures/{factureId}/status")
    public FactureRecord updateStatus(@PathVariable String factureId,
                                      @RequestBody Map<String, Object> payload,
                                      @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.updateFactureStatus(factureId, payload);
    }
}
