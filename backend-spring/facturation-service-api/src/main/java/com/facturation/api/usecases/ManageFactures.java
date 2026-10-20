package com.facturation.api.usecases;

import com.facturation.api.model.FactureCreateRequest;
import com.facturation.api.model.FactureResponse;
import com.facturation.api.model.FactureStatusRequest;
import com.facturation.api.model.RequestContext;
import java.util.List;

public interface ManageFactures {

    List<FactureResponse> listFactures(RequestContext ctx);

    FactureResponse getFacture(String factureId, RequestContext ctx);

    FactureResponse createFacture(FactureCreateRequest input, RequestContext ctx);

    List<FactureResponse> deleteFacture(String factureId, RequestContext ctx);

    FactureResponse updateFactureStatus(String factureId, FactureStatusRequest input, RequestContext ctx);
}
