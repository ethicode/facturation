package com.facturation.gateway.outbound.adapter;

import com.facturation.core.port.DirectionGateway;
import com.facturation.gateway.outbound.entity.DirectionEntity;
import com.facturation.gateway.outbound.repository.DirectionRepository;
import com.facturation.gateway.outbound.repository.SupplyTicketRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DirectionGatewayAdapter implements DirectionGateway {

    private final DirectionRepository repository;
    private final SupplyTicketRepository ticketRepository;
    private final EntityManager entityManager;

    @Override
    public List<String> findAll() {
        return repository.findAllByOrderByPositionAsc().stream().map(DirectionEntity::getName).toList();
    }

    @Override
    public void create(String name) {
        DirectionEntity entity = new DirectionEntity();
        entity.setName(name);
        entity.setPosition(repository.findMaxPosition() + 1);
        repository.saveAndFlush(entity);
    }

    /**
     * Le nom de direction est une clé primaire référencée par appro_budgets puis appro_budget_items :
     * on crée la nouvelle clé, on y rattache les lignes, puis on supprime l'ancienne.
     */
    @Override
    public void rename(String currentName, String nextName) {
        entityManager.flush();
        execute("insert into directions (name, position) select :next, position from directions where name = :current",
                currentName, nextName);
        execute("""
                insert into appro_budgets (direction, allocated, engaged, allocated_by, position)
                select :next, allocated, engaged, allocated_by, position from appro_budgets where direction = :current
                """, currentName, nextName);
        execute("update appro_budget_items set direction = :next where direction = :current", currentName, nextName);
        execute("delete from appro_budgets where direction = :current", currentName, null);
        execute("delete from directions where name = :current", currentName, null);
        entityManager.clear();
        ticketRepository.renameDirection(currentName, nextName);
    }

    @Override
    public void delete(String name) {
        repository.deleteById(name);
        repository.flush();
    }

    private void execute(String sql, String currentName, String nextName) {
        var query = entityManager.createNativeQuery(sql).setParameter("current", currentName);
        if (nextName != null) {
            query.setParameter("next", nextName);
        }
        query.executeUpdate();
    }
}
