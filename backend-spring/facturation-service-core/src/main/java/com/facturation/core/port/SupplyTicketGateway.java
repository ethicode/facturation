package com.facturation.core.port;

import com.facturation.core.model.SupplyTicket;
import java.util.List;
import java.util.Optional;

public interface SupplyTicketGateway {

    List<SupplyTicket> findAll();

    Optional<SupplyTicket> findById(String id);

    List<String> findAllIds();

    List<SupplyTicket> findByLinkedFactureId(String factureId);

    SupplyTicket save(SupplyTicket ticket);

    void deleteById(String id);

    boolean existsByDirectionIgnoreCase(String direction);

    boolean existsByDomainIgnoreCase(String domain);

    boolean existsByDomainAndSubdomainIgnoreCase(String domain, String subdomain);

    void renameSubdomain(String domain, String currentName, String nextName);
}
