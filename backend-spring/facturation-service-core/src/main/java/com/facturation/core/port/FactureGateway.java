package com.facturation.core.port;

import com.facturation.core.model.Facture;
import java.util.List;
import java.util.Optional;

public interface FactureGateway {

    List<Facture> findAll();

    Optional<Facture> findById(String id);

    List<String> findAllIds();

    /** Crée (en tête de liste) ou met à jour la facture, historique et pièces jointes compris. */
    Facture save(Facture facture);

    void deleteById(String id);
}
