package com.facturation.core.port;

import com.facturation.core.model.DirfinHistoryEntry;
import java.util.List;

public interface DirfinHistoryGateway {

    List<DirfinHistoryEntry> findAll();

    /** Ajoute l'événement en tête du journal. */
    void add(DirfinHistoryEntry entry);
}
