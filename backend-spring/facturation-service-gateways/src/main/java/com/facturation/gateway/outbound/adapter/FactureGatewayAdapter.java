package com.facturation.gateway.outbound.adapter;

import com.facturation.core.model.Facture;
import com.facturation.core.port.FactureGateway;
import com.facturation.gateway.outbound.entity.FactureEntity;
import com.facturation.gateway.outbound.mapper.HistoryMapper;
import com.facturation.gateway.outbound.repository.FactureRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FactureGatewayAdapter implements FactureGateway {

    private final FactureRepository repository;

    @Override
    public List<Facture> findAll() {
        return repository.findAllByOrderByPositionAsc().stream().map(FactureGatewayAdapter::toDomain).toList();
    }

    @Override
    public Optional<Facture> findById(String id) {
        return repository.findById(id).map(FactureGatewayAdapter::toDomain);
    }

    @Override
    public List<String> findAllIds() {
        return repository.findAllIds();
    }

    @Override
    public Facture save(Facture facture) {
        FactureEntity entity = repository.findById(facture.getId()).orElseGet(() -> {
            FactureEntity created = new FactureEntity();
            created.setId(facture.getId());
            created.setPosition(repository.findMinPosition() - 1);
            return created;
        });

        entity.setFournisseur(facture.getFournisseur());
        entity.setMontant(facture.getMontant());
        entity.setDevise(facture.getDevise());
        entity.setCentreCout(facture.getCentreCout());
        entity.setDescription(facture.getDescription());
        entity.setEcheance(facture.getEcheance());
        entity.setPriorite(facture.getPriorite());
        entity.setDirection(facture.getDirection());
        entity.setResume(facture.getResume());
        entity.setNumeroFacture(facture.getNumeroFacture());
        entity.setCompteCharge(facture.getCompteCharge());
        entity.setDateReception(facture.getDateReception());
        entity.setModeReception(facture.getModeReception());
        entity.setStatut(facture.getStatut());
        if (!entity.getPiecesJointes().equals(facture.getPiecesJointes())) {
            entity.getPiecesJointes().clear();
            entity.getPiecesJointes().addAll(facture.getPiecesJointes());
        }
        HistoryMapper.prependNewEntries(entity.getHistory(), facture.getHistory(), HistoryMapper::toFactureEntity);

        return toDomain(repository.saveAndFlush(entity));
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
        repository.flush();
    }

    static Facture toDomain(FactureEntity entity) {
        return Facture.builder()
                .id(entity.getId())
                .fournisseur(entity.getFournisseur())
                .montant(entity.getMontant())
                .devise(entity.getDevise())
                .centreCout(entity.getCentreCout())
                .description(entity.getDescription())
                .echeance(entity.getEcheance())
                .priorite(entity.getPriorite())
                .direction(entity.getDirection())
                .resume(entity.getResume())
                .numeroFacture(entity.getNumeroFacture())
                .compteCharge(entity.getCompteCharge())
                .dateReception(entity.getDateReception())
                .modeReception(entity.getModeReception())
                .piecesJointes(new ArrayList<>(entity.getPiecesJointes()))
                .statut(entity.getStatut())
                .history(new ArrayList<>(entity.getHistory().stream().map(HistoryMapper::toDomain).toList()))
                .build();
    }
}
