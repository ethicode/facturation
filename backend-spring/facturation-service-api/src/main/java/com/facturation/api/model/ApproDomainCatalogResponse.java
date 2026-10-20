package com.facturation.api.model;

import java.util.List;

public record ApproDomainCatalogResponse(List<Entry> domains) {

    public record Entry(String domain, List<String> subdomains) {
    }
}
