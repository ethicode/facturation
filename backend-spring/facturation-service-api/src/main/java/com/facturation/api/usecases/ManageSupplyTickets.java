package com.facturation.api.usecases;

import com.facturation.api.model.ApproDomainCatalogResponse;
import com.facturation.api.model.ApproStateResponse;
import com.facturation.api.model.RequestContext;
import com.facturation.api.model.SupplyTicketCreateRequest;
import com.facturation.api.model.SupplyTicketResponse;

public interface ManageSupplyTickets {

    ApproDomainCatalogResponse getApproDomainCatalog(RequestContext ctx);

    SupplyTicketResponse createSupplyTicket(SupplyTicketCreateRequest input, RequestContext ctx);

    ApproStateResponse deleteSupplyTicket(String ticketId, RequestContext ctx);

    ApproStateResponse verifyTicketBudget(String ticketId, String actor, RequestContext ctx);

    ApproStateResponse closeTicket(String ticketId, String actor, RequestContext ctx);
}
