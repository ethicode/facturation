package com.facturation.gateway.outbound.adapter;

import com.facturation.core.port.StatusCatalogGateway;
import com.facturation.gateway.outbound.repository.StatusCatalogRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StatusCatalogGatewayAdapter implements StatusCatalogGateway {

    private final StatusCatalogRepository repository;

    @Override
    public List<String> findStatuses(String workflow) {
        return repository.findStatuses(workflow);
    }
}
