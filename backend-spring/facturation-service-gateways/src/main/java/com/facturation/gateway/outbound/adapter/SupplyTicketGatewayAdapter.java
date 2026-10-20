package com.facturation.gateway.outbound.adapter;

import com.facturation.core.model.SupplyTicket;
import com.facturation.core.port.SupplyTicketGateway;
import com.facturation.gateway.outbound.entity.SupplyTicketEntity;
import com.facturation.gateway.outbound.mapper.HistoryMapper;
import com.facturation.gateway.outbound.repository.SupplyTicketRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SupplyTicketGatewayAdapter implements SupplyTicketGateway {

    private final SupplyTicketRepository repository;

    @Override
    public List<SupplyTicket> findAll() {
        return repository.findAllByOrderByPositionAsc().stream().map(SupplyTicketGatewayAdapter::toDomain).toList();
    }

    @Override
    public Optional<SupplyTicket> findById(String id) {
        return repository.findById(id).map(SupplyTicketGatewayAdapter::toDomain);
    }

    @Override
    public List<String> findAllIds() {
        return repository.findAllIds();
    }

    @Override
    public List<SupplyTicket> findByLinkedFactureId(String factureId) {
        return repository.findByLinkedFactureId(factureId).stream().map(SupplyTicketGatewayAdapter::toDomain).toList();
    }

    @Override
    public SupplyTicket save(SupplyTicket ticket) {
        SupplyTicketEntity entity = repository.findById(ticket.getId()).orElseGet(() -> {
            SupplyTicketEntity created = new SupplyTicketEntity();
            created.setId(ticket.getId());
            created.setPosition(repository.findMinPosition() - 1);
            return created;
        });

        entity.setDirection(ticket.getDirection());
        entity.setObjet(ticket.getObjet());
        entity.setMontant(ticket.getMontant());
        entity.setDevise(ticket.getDevise());
        entity.setTitreDemande(ticket.getTitreDemande());
        entity.setDomaine(ticket.getDomaine());
        entity.setSousDomaine(ticket.getSousDomaine());
        entity.setActionDemande(ticket.getActionDemande());
        entity.setDateDebutSouhaitee(ticket.getDateDebutSouhaitee());
        entity.setDateFinSouhaitee(ticket.getDateFinSouhaitee());
        entity.setDirectionDemandeur(ticket.getDirectionDemandeur());
        entity.setBudgetPrevisionnel(ticket.getBudgetPrevisionnel());
        entity.setPriorite(ticket.getPriorite());
        entity.setDescription(ticket.getDescription());
        entity.setCommentaire(ticket.getCommentaire());
        entity.setFichierNom(ticket.getFichierNom());
        entity.setStatut(ticket.getStatut());
        entity.setLinkedFactureId(ticket.getLinkedFactureId());
        HistoryMapper.prependNewEntries(entity.getHistory(), ticket.getHistory(), HistoryMapper::toTicketEntity);

        return toDomain(repository.saveAndFlush(entity));
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
        repository.flush();
    }

    @Override
    public boolean existsByDirectionIgnoreCase(String direction) {
        return repository.existsByDirectionIgnoreCase(direction);
    }

    @Override
    public boolean existsByDomainIgnoreCase(String domain) {
        return repository.existsByDomaineIgnoreCase(domain);
    }

    @Override
    public boolean existsByDomainAndSubdomainIgnoreCase(String domain, String subdomain) {
        return repository.existsByDomaineIgnoreCaseAndSousDomaineIgnoreCase(domain, subdomain);
    }

    @Override
    public void renameSubdomain(String domain, String currentName, String nextName) {
        repository.renameSubdomain(domain, currentName, nextName);
    }

    static SupplyTicket toDomain(SupplyTicketEntity entity) {
        return SupplyTicket.builder()
                .id(entity.getId())
                .direction(entity.getDirection())
                .objet(entity.getObjet())
                .montant(entity.getMontant())
                .devise(entity.getDevise())
                .titreDemande(entity.getTitreDemande())
                .domaine(entity.getDomaine())
                .sousDomaine(entity.getSousDomaine())
                .actionDemande(entity.getActionDemande())
                .dateDebutSouhaitee(entity.getDateDebutSouhaitee())
                .dateFinSouhaitee(entity.getDateFinSouhaitee())
                .directionDemandeur(entity.getDirectionDemandeur())
                .budgetPrevisionnel(entity.getBudgetPrevisionnel())
                .priorite(entity.getPriorite())
                .description(entity.getDescription())
                .commentaire(entity.getCommentaire())
                .fichierNom(entity.getFichierNom())
                .statut(entity.getStatut())
                .linkedFactureId(entity.getLinkedFactureId())
                .history(new ArrayList<>(entity.getHistory().stream().map(HistoryMapper::toDomain).toList()))
                .build();
    }
}
