package com.facturation.core.port;

import com.facturation.core.model.ApproDomain;
import java.util.List;

public interface ApproDomainGateway {

    List<ApproDomain> findAll();

    void createDomain(String name);

    void deleteDomain(String name);

    void addSubdomain(String domain, String name);

    void renameSubdomain(String domain, String currentName, String nextName);

    void deleteSubdomain(String domain, String name);
}
