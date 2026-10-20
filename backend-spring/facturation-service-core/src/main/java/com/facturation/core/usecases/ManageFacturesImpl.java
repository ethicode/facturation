package com.facturation.core.usecases;

import com.facturation.api.model.FactureCreateRequest;
import com.facturation.api.model.FactureResponse;
import com.facturation.api.model.FactureStatusRequest;
import com.facturation.api.model.RequestContext;
import com.facturation.api.usecases.ManageFactures;
import com.facturation.core.mapper.CommandMapper;
import com.facturation.core.mapper.ResponseMapper;
import com.facturation.core.service.FactureService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ManageFacturesImpl implements ManageFactures {

    private final FactureService factureService;

    @Override
    public List<FactureResponse> listFactures(RequestContext ctx) {
        return ResponseMapper.toFactureResponses(factureService.list());
    }

    @Override
    public FactureResponse getFacture(String factureId, RequestContext ctx) {
        return ResponseMapper.toResponse(factureService.get(factureId));
    }

    @Override
    public FactureResponse createFacture(FactureCreateRequest input, RequestContext ctx) {
        return ResponseMapper.toResponse(factureService.create(CommandMapper.toCommand(input)));
    }

    @Override
    public List<FactureResponse> deleteFacture(String factureId, RequestContext ctx) {
        return ResponseMapper.toFactureResponses(factureService.delete(factureId));
    }

    @Override
    public FactureResponse updateFactureStatus(String factureId, FactureStatusRequest input, RequestContext ctx) {
        return ResponseMapper.toResponse(factureService.updateStatus(factureId, CommandMapper.toCommand(input)));
    }
}
