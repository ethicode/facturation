package com.facturation.gateway.inbound;

import com.facturation.api.ApproAPI;
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
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ApproEndpoint implements ApproAPI {

    private final ManageBudgets manageBudgets;
    private final ManageSupplyTickets manageSupplyTickets;

    @Override
    public ApproStateResponse getApproState(RequestContext ctx) {
        return manageBudgets.getApproState(ctx);
    }

    @Override
    public ApproStateResponse saveDirectionBudget(BudgetUpsertRequest input, RequestContext ctx) {
        return manageBudgets.saveDirectionBudget(input, ctx);
    }

    @Override
    public ApproStateResponse createBudgetItem(String directionName, BudgetItemCreateRequest input, RequestContext ctx) {
        return manageBudgets.createBudgetItem(directionName, input, ctx);
    }

    @Override
    public ApproStateResponse updateBudgetItem(String itemId, BudgetItemUpdateRequest input, RequestContext ctx) {
        return manageBudgets.updateBudgetItem(itemId, input, ctx);
    }

    @Override
    public ApproStateResponse deleteBudgetItem(String itemId, RequestContext ctx) {
        return manageBudgets.deleteBudgetItem(itemId, ctx);
    }

    @Override
    public DeleteBudgetResponse deleteDirectionBudget(String directionName, String actor, RequestContext ctx) {
        return manageBudgets.deleteDirectionBudget(directionName, actor, ctx);
    }

    @Override
    public ApproDomainCatalogResponse getApproDomainCatalog(RequestContext ctx) {
        return manageSupplyTickets.getApproDomainCatalog(ctx);
    }

    @Override
    public SupplyTicketResponse createSupplyTicket(SupplyTicketCreateRequest input, RequestContext ctx) {
        return manageSupplyTickets.createSupplyTicket(input, ctx);
    }

    @Override
    public ApproStateResponse deleteSupplyTicket(String ticketId, RequestContext ctx) {
        return manageSupplyTickets.deleteSupplyTicket(ticketId, ctx);
    }

    @Override
    public ApproStateResponse verifyTicketBudget(String ticketId, String actor, RequestContext ctx) {
        return manageSupplyTickets.verifyTicketBudget(ticketId, actor, ctx);
    }

    @Override
    public ApproStateResponse closeTicket(String ticketId, String actor, RequestContext ctx) {
        return manageSupplyTickets.closeTicket(ticketId, actor, ctx);
    }
}
