package com.facturation.gateway.outbound.adapter;

import com.facturation.core.model.Mission;
import com.facturation.core.port.MissionGateway;
import com.facturation.gateway.outbound.entity.MissionEntity;
import com.facturation.gateway.outbound.mapper.HistoryMapper;
import com.facturation.gateway.outbound.repository.MissionRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MissionGatewayAdapter implements MissionGateway {

    private final MissionRepository repository;

    @Override
    public List<Mission> findAll() {
        return repository.findAllByOrderByPositionAsc().stream().map(MissionGatewayAdapter::toDomain).toList();
    }

    @Override
    public Optional<Mission> findByCode(String code) {
        return repository.findById(code).map(MissionGatewayAdapter::toDomain);
    }

    @Override
    public List<String> findAllCodes() {
        return repository.findAllCodes();
    }

    @Override
    public boolean existsByCodeIgnoreCase(String code) {
        return repository.existsByCodeIgnoreCase(code);
    }

    @Override
    public Mission save(Mission mission) {
        MissionEntity entity = repository.findById(mission.getCode()).orElseGet(() -> {
            MissionEntity created = new MissionEntity();
            created.setCode(mission.getCode());
            created.setPosition(repository.findMinPosition() - 1);
            return created;
        });

        entity.setObjetMission(mission.getObjetMission());
        entity.setDestination(mission.getDestination());
        entity.setPays(mission.getPays());
        entity.setDateDepart(mission.getDateDepart());
        entity.setDateRetour(mission.getDateRetour());
        entity.setMontantEstimatif(mission.getMontantEstimatif());
        entity.setBudgetConcerne(mission.getBudgetConcerne() == null ? "" : mission.getBudgetConcerne());
        entity.setBudgetItemId(mission.getBudgetItemId());
        entity.setBudgetConsumed(mission.getBudgetConsumed());
        entity.setBudgetConsumedAt(mission.getBudgetConsumedAt());
        entity.setStatut(mission.getStatut());
        if (!entity.getPiecesJointes().equals(mission.getPiecesJointes())) {
            entity.getPiecesJointes().clear();
            entity.getPiecesJointes().addAll(mission.getPiecesJointes());
        }
        HistoryMapper.prependNewEntries(entity.getHistory(), mission.getHistory(), HistoryMapper::toMissionEntity);

        return toDomain(repository.saveAndFlush(entity));
    }

    @Override
    public BigDecimal sumConsumedByBudgetItem(String budgetItemId) {
        return repository.sumConsumedByBudgetItem(budgetItemId);
    }

    @Override
    public boolean existsByBudgetItemIdIn(Collection<String> budgetItemIds) {
        return repository.existsByBudgetItemIdIn(budgetItemIds);
    }

    static Mission toDomain(MissionEntity entity) {
        return Mission.builder()
                .code(entity.getCode())
                .objetMission(entity.getObjetMission())
                .destination(entity.getDestination())
                .pays(entity.getPays())
                .dateDepart(entity.getDateDepart())
                .dateRetour(entity.getDateRetour())
                .montantEstimatif(entity.getMontantEstimatif())
                .budgetConcerne(entity.getBudgetConcerne())
                .budgetItemId(entity.getBudgetItemId())
                .budgetConsumed(entity.getBudgetConsumed())
                .budgetConsumedAt(entity.getBudgetConsumedAt())
                .piecesJointes(new ArrayList<>(entity.getPiecesJointes()))
                .statut(entity.getStatut())
                .history(new ArrayList<>(entity.getHistory().stream().map(HistoryMapper::toDomain).toList()))
                .build();
    }
}
