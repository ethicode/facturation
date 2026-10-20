package com.facturation.core.usecases;

import com.facturation.api.model.ApproDomainCatalogResponse;
import com.facturation.api.model.ApproDomainRequest;
import com.facturation.api.model.ApproSubdomainRequest;
import com.facturation.api.model.ApproSubdomainUpdateRequest;
import com.facturation.api.model.RequestContext;
import com.facturation.api.usecases.ManageApproDomains;
import com.facturation.core.mapper.ResponseMapper;
import com.facturation.core.model.command.SubdomainRenameCommand;
import com.facturation.core.service.ApproDomainService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ManageApproDomainsImpl implements ManageApproDomains {

    private final ApproDomainService domainService;

    @Override
    public ApproDomainCatalogResponse listApproDomains(RequestContext ctx) {
        return ResponseMapper.toCatalog(domainService.catalog());
    }

    @Override
    public ApproDomainCatalogResponse createApproDomain(ApproDomainRequest input, RequestContext ctx) {
        return ResponseMapper.toCatalog(domainService.createDomain(input.name()));
    }

    @Override
    public ApproDomainCatalogResponse deleteApproDomain(String domainName, RequestContext ctx) {
        return ResponseMapper.toCatalog(domainService.deleteDomain(domainName));
    }

    @Override
    public ApproDomainCatalogResponse createApproSubdomain(ApproSubdomainRequest input, RequestContext ctx) {
        return ResponseMapper.toCatalog(domainService.createSubdomain(input.domain(), input.name()));
    }

    @Override
    public ApproDomainCatalogResponse updateApproSubdomain(ApproSubdomainUpdateRequest input, RequestContext ctx) {
        return ResponseMapper.toCatalog(domainService.renameSubdomain(
                new SubdomainRenameCommand(input.domain(), input.currentName(), input.nextName())));
    }

    @Override
    public ApproDomainCatalogResponse deleteApproSubdomain(String domainName, String subdomainName,
                                                           RequestContext ctx) {
        return ResponseMapper.toCatalog(domainService.deleteSubdomain(domainName, subdomainName));
    }
}
