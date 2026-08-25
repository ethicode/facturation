package com.facturation.backend.controller;

import com.facturation.backend.service.AppService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/appro")
public class ApproController extends BaseController {
    public ApproController(AppService appService) {
        super(appService);
    }

    @GetMapping
    public Map<String, Object> appro(@RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.appro();
    }

    @PostMapping("/budgets")
    public Map<String, Object> saveBudget(@RequestBody Map<String, Object> payload,
                                          @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.saveBudget(payload);
    }

    @DeleteMapping("/budgets/{directionName}")
    public Map<String, Object> deleteBudget(@PathVariable String directionName,
                                            @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.deleteBudget(directionName);
    }

    @PostMapping("/tickets")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createTicket(@RequestBody Map<String, Object> payload,
                                            @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.createTicket(payload);
    }

    @DeleteMapping("/tickets/{ticketId}")
    public Map<String, Object> deleteTicket(@PathVariable String ticketId,
                                            @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.deleteTicket(ticketId);
    }

    @PostMapping("/tickets/{ticketId}/verify")
    public Map<String, Object> verifyTicket(@PathVariable String ticketId,
                                            @RequestParam(defaultValue = "Agent Approvisionnement") String actor,
                                            @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.verifyTicket(ticketId, actor);
    }

    @PostMapping("/tickets/{ticketId}/close")
    public Map<String, Object> closeTicket(@PathVariable String ticketId,
                                           @RequestParam(defaultValue = "Agent Approvisionnement") String actor,
                                           @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);
        return appService.closeTicket(ticketId, actor);
    }
}
