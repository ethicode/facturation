package com.facturation.core.port;

import java.util.List;

public interface StatusCatalogGateway {

    String FACTURATION = "facturation";
    String APPRO = "appro";

    List<String> findStatuses(String workflow);
}
