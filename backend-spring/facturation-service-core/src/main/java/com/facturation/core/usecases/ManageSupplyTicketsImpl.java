package com.facturation.core.usecases;

import com.facturation.api.model.ApproDomainCatalogResponse;
import com.facturation.api.model.ApproStateResponse;
import com.facturation.api.model.RequestContext;
import com.facturation.api.model.SupplyTicketCreateRequest;
import com.facturation.api.model.SupplyTicketResponse;
import com.facturation.api.usecases.ManageSupplyTickets;
import com.facturation.core.mapper.CommandMapper;
import com.facturation.core.mapper.ResponseMapper;
import com.facturation.core.service.ApproDomainService;
import com.facturation.core.service.ApproService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ManageSupplyTicketsImpl implements ManageSupplyTickets {

    private final ApproService approService;
    private final ApproDomainService domainService;

    @Override
    public ApproDomainCatalogResponse getApproDomainCatalog(RequestContext ctx) {
        return ResponseMapper.toCatalog(domainService.catalog());
    }

    @Override
    public SupplyTicketResponse createSupplyTicket(SupplyTicketCreateRequest input, RequestContext ctx) {
        return ResponseMapper.toResponse(approService.createTicket(CommandMapper.toCommand(input)));
    }

    @Override
    public ApproStateResponse deleteSupplyTicket(String ticketId, RequestContext ctx) {
        return ResponseMapper.toResponse(approService.deleteTicket(ticketId));
    }

    @Override
    public ApproStateResponse verifyTicketBudget(String ticketId, String actor, RequestContext ctx) {
        return ResponseMapper.toResponse(approService.verifyTicketBudget(ticketId, actor));
    }

    @Override
    public ApproStateResponse closeTicket(String ticketId, String actor, RequestContext ctx) {
        return ResponseMapper.toResponse(approService.closeTicket(ticketId, actor));
    }
}
