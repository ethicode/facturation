package com.facturation.core.port;

import com.facturation.core.model.Role;
import java.util.List;

public interface RoleGateway {

    List<Role> findAll();

    boolean existsByCode(String code);

    /** Crée le rôle en fin de liste ou met à jour son libellé. */
    Role save(Role role);

    void deleteByCode(String code);
}
