package com.facturation.api;

import com.facturation.api.model.FactureCreateRequest;
import com.facturation.api.model.FactureResponse;
import com.facturation.api.model.FactureStatusRequest;
import com.facturation.api.model.RequestContext;
import com.facturation.api.usecases.ManageFactures;
import com.facturation.api.usecases.UploadAttachments;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.multipart.MultipartFile;

@RequestMapping(produces = "application/json")
public interface FactureAPI extends ManageFactures, UploadAttachments {

    @GetMapping("/api/factures")
    @Override
    List<FactureResponse> listFactures(RequestContext ctx);

    @GetMapping("/api/factures/{factureId}")
    @Override
    FactureResponse getFacture(@PathVariable("factureId") String factureId, RequestContext ctx);

    @PostMapping("/api/factures")
    @ResponseStatus(HttpStatus.CREATED)
    @Override
    FactureResponse createFacture(@Valid @RequestBody FactureCreateRequest input, RequestContext ctx);

    @DeleteMapping("/api/factures/{factureId}")
    @Override
    List<FactureResponse> deleteFacture(@PathVariable("factureId") String factureId, RequestContext ctx);

    @PatchMapping("/api/factures/{factureId}/status")
    @Override
    FactureResponse updateFactureStatus(@PathVariable("factureId") String factureId,
                                        @Valid @RequestBody FactureStatusRequest input, RequestContext ctx);

    @PostMapping(value = "/api/uploads", consumes = "multipart/form-data")
    @Override
    List<String> uploadAttachments(@RequestPart("files") List<MultipartFile> files, RequestContext ctx);
}
