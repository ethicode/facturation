package com.facturation.api.usecases;

import com.facturation.api.model.ApproDomainCatalogResponse;
import com.facturation.api.model.ApproDomainRequest;
import com.facturation.api.model.ApproSubdomainRequest;
import com.facturation.api.model.ApproSubdomainUpdateRequest;
import com.facturation.api.model.RequestContext;

public interface ManageApproDomains {

    ApproDomainCatalogResponse listApproDomains(RequestContext ctx);

    ApproDomainCatalogResponse createApproDomain(ApproDomainRequest input, RequestContext ctx);

    ApproDomainCatalogResponse deleteApproDomain(String domainName, RequestContext ctx);

    ApproDomainCatalogResponse createApproSubdomain(ApproSubdomainRequest input, RequestContext ctx);

    ApproDomainCatalogResponse updateApproSubdomain(ApproSubdomainUpdateRequest input, RequestContext ctx);

    ApproDomainCatalogResponse deleteApproSubdomain(String domainName, String subdomainName, RequestContext ctx);
}
