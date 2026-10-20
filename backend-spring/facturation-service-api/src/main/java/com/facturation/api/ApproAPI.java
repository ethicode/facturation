package com.facturation.api;

import com.facturation.api.model.ApproDomainCatalogResponse;
import com.facturation.api.model.ApproStateResponse;
import com.facturation.api.model.BudgetItemCreateRequest;
import com.facturation.api.model.BudgetItemUpdateRequest;
import com.facturation.api.model.BudgetUpsertRequest;
import com.facturation.api.model.DeleteBudgetResponse;
import com.facturation.api.model.RequestContext;
import com.facturation.api.model.SupplyTicketCreateRequest;
import com.facturation.api.model.SupplyTicketResponse;
import com.facturation.api.usecases.ManageBudgets;
import com.facturation.api.usecases.ManageSupplyTickets;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;

@RequestMapping(produces = "application/json")
public interface ApproAPI extends ManageBudgets, ManageSupplyTickets {

    String DEFAULT_APPRO_ACTOR = "Agent Approvisionnement";

    @GetMapping("/api/appro")
    @Override
    ApproStateResponse getApproState(RequestContext ctx);

    @PostMapping("/api/appro/budgets")
    @Override
    ApproStateResponse saveDirectionBudget(@Valid @RequestBody BudgetUpsertRequest input, RequestContext ctx);

    @PostMapping("/api/appro/budgets/{directionName}/items")
    @Override
    ApproStateResponse createBudgetItem(@PathVariable("directionName") String directionName,
                                        @Valid @RequestBody BudgetItemCreateRequest input, RequestContext ctx);

    @PutMapping("/api/appro/budget-items/{itemId}")
    @Override
    ApproStateResponse updateBudgetItem(@PathVariable("itemId") String itemId,
                                        @Valid @RequestBody BudgetItemUpdateRequest input, RequestContext ctx);

    @DeleteMapping("/api/appro/budget-items/{itemId}")
    @Override
    ApproStateResponse deleteBudgetItem(@PathVariable("itemId") String itemId, RequestContext ctx);

    @DeleteMapping("/api/appro/budgets/{directionName}")
    @Override
    DeleteBudgetResponse deleteDirectionBudget(@PathVariable("directionName") String directionName,
                                               @RequestParam(name = "actor", defaultValue = "DirFin") String actor,
                                               RequestContext ctx);

    @GetMapping("/api/meta/appro-domains")
    @Override
    ApproDomainCatalogResponse getApproDomainCatalog(RequestContext ctx);

    @PostMapping("/api/appro/tickets")
    @ResponseStatus(HttpStatus.CREATED)
    @Override
    SupplyTicketResponse createSupplyTicket(@RequestBody SupplyTicketCreateRequest input, RequestContext ctx);

    @DeleteMapping("/api/appro/tickets/{ticketId}")
    @Override
    ApproStateResponse deleteSupplyTicket(@PathVariable("ticketId") String ticketId, RequestContext ctx);

    @PostMapping("/api/appro/tickets/{ticketId}/verify")
    @Override
    ApproStateResponse verifyTicketBudget(@PathVariable("ticketId") String ticketId,
                                          @RequestParam(name = "actor", defaultValue = DEFAULT_APPRO_ACTOR) String actor,
                                          RequestContext ctx);

    @PostMapping("/api/appro/tickets/{ticketId}/close")
    @Override
    ApproStateResponse closeTicket(@PathVariable("ticketId") String ticketId,
                                   @RequestParam(name = "actor", defaultValue = DEFAULT_APPRO_ACTOR) String actor,
                                   RequestContext ctx);
}
