package com.facturation.core.port;

import java.util.List;

public interface DirectionGateway {

    List<String> findAll();

    void create(String name);

    /** Renomme la direction et répercute le nouveau nom sur les budgets, lignes budgétaires et tickets. */
    void rename(String currentName, String nextName);

    void delete(String name);
}
