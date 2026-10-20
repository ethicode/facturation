package com.facturation.gateway.outbound.adapter;

import com.facturation.core.model.DirfinHistoryEntry;
import com.facturation.core.port.DirfinHistoryGateway;
import com.facturation.gateway.outbound.entity.DirfinHistoryEntity;
import com.facturation.gateway.outbound.repository.DirfinHistoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DirfinHistoryGatewayAdapter implements DirfinHistoryGateway {

    private final DirfinHistoryRepository repository;

    @Override
    public List<DirfinHistoryEntry> findAll() {
        return repository.findAllByOrderByPositionAsc().stream()
                .map(entity -> DirfinHistoryEntry.builder()
                        .id(entity.getId())
                        .at(entity.getEventAt())
                        .actor(entity.getActor())
                        .action(entity.getAction())
                        .detail(entity.getDetail())
                        .build())
                .toList();
    }

    @Override
    public void add(DirfinHistoryEntry entry) {
        DirfinHistoryEntity entity = new DirfinHistoryEntity();
        entity.setId(entry.getId());
        entity.setEventAt(entry.getAt());
        entity.setActor(entry.getActor());
        entity.setAction(entry.getAction());
        entity.setDetail(entry.getDetail() == null ? "" : entry.getDetail());
        entity.setPosition(repository.findMinPosition() - 1);
        repository.saveAndFlush(entity);
    }
}
