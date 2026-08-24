package com.facturation.api.controller;

import com.facturation.core.model.ApproState;
import com.facturation.core.model.SupplyTicket;
import com.facturation.core.service.BackendService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/appro")
@Tag(name = "Approvisionnement")
public class ApproController extends BaseSecuredController {
    public ApproController(BackendService backendService) {
        super(backendService);
    }

    @GetMapping
    public ApproState getState(@RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.getApproState();
    }

    @PostMapping("/budgets")
    public ApproState saveBudget(@RequestBody Map<String, Object> payload,
                                 @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.saveBudget(payload);
    }

    @DeleteMapping("/budgets/{directionName}")
    public Map<String, Object> deleteBudget(@PathVariable String directionName,
                                            @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.deleteBudget(directionName);
    }

    @PostMapping("/tickets")
    @ResponseStatus(HttpStatus.CREATED)
    public SupplyTicket createTicket(@RequestBody Map<String, Object> payload,
                                     @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.createTicket(payload);
    }

    @DeleteMapping("/tickets/{ticketId}")
    public ApproState deleteTicket(@PathVariable String ticketId,
                                   @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.deleteTicket(ticketId);
    }

    @PostMapping("/tickets/{ticketId}/verify")
    public ApproState verifyTicket(@PathVariable String ticketId,
                                   @RequestParam(defaultValue = "Agent Approvisionnement") String actor,
                                   @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.verifyTicket(ticketId, actor);
    }

    @PostMapping("/tickets/{ticketId}/close")
    public ApproState closeTicket(@PathVariable String ticketId,
                                  @RequestParam(defaultValue = "Agent Approvisionnement") String actor,
                                  @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return backendService.closeTicket(ticketId, actor);
    }
}
