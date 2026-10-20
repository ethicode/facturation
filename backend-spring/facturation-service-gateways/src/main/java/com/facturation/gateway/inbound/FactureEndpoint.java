package com.facturation.gateway.inbound;

import com.facturation.api.FactureAPI;
import com.facturation.api.model.FactureCreateRequest;
import com.facturation.api.model.FactureResponse;
import com.facturation.api.model.FactureStatusRequest;
import com.facturation.api.model.RequestContext;
import com.facturation.api.usecases.ManageFactures;
import com.facturation.api.usecases.UploadAttachments;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class FactureEndpoint implements FactureAPI {

    private final ManageFactures manageFactures;
    private final UploadAttachments uploadAttachments;

    @Override
    public List<FactureResponse> listFactures(RequestContext ctx) {
        return manageFactures.listFactures(ctx);
    }

    @Override
    public FactureResponse getFacture(String factureId, RequestContext ctx) {
        return manageFactures.getFacture(factureId, ctx);
    }

    @Override
    public FactureResponse createFacture(FactureCreateRequest input, RequestContext ctx) {
        return manageFactures.createFacture(input, ctx);
    }

    @Override
    public List<FactureResponse> deleteFacture(String factureId, RequestContext ctx) {
        return manageFactures.deleteFacture(factureId, ctx);
    }

    @Override
    public FactureResponse updateFactureStatus(String factureId, FactureStatusRequest input, RequestContext ctx) {
        return manageFactures.updateFactureStatus(factureId, input, ctx);
    }

    @Override
    public List<String> uploadAttachments(List<MultipartFile> files, RequestContext ctx) {
        return uploadAttachments.uploadAttachments(files, ctx);
    }
}
