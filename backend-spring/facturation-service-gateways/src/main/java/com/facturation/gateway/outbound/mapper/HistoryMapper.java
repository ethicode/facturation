package com.facturation.gateway.outbound.mapper;

import com.facturation.core.model.HistoryEntry;
import com.facturation.gateway.outbound.entity.FactureHistoryEntity;
import com.facturation.gateway.outbound.entity.HistoryEntryEntity;
import com.facturation.gateway.outbound.entity.MissionHistoryEntity;
import com.facturation.gateway.outbound.entity.SupplyTicketHistoryEntity;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

public final class HistoryMapper {

    private HistoryMapper() {
    }

    /**
     * L'historique est en ajout seul (les nouvelles entrées sont placées en tête par les services) :
     * seules les entrées supplémentaires du modèle sont insérées, les lignes existantes ne sont pas réécrites.
     */
    public static <E extends HistoryEntryEntity> void prependNewEntries(List<E> entities, List<HistoryEntry> history,
                                                                        Function<HistoryEntry, E> factory) {
        int newEntries = history.size() - entities.size();
        for (int index = newEntries - 1; index >= 0; index--) {
            entities.add(0, factory.apply(history.get(index)));
        }
    }

    public static FactureHistoryEntity toFactureEntity(HistoryEntry entry) {
        FactureHistoryEntity entity = fill(new FactureHistoryEntity(), entry);
        entity.setPiecesJointes(new ArrayList<>(entry.getPiecesJointes()));
        return entity;
    }

    public static SupplyTicketHistoryEntity toTicketEntity(HistoryEntry entry) {
        SupplyTicketHistoryEntity entity = fill(new SupplyTicketHistoryEntity(), entry);
        entity.setEventId(entry.getId());
        entity.setPiecesJointes(new ArrayList<>(entry.getPiecesJointes()));
        return entity;
    }

    public static MissionHistoryEntity toMissionEntity(HistoryEntry entry) {
        MissionHistoryEntity entity = fill(new MissionHistoryEntity(), entry);
        entity.setEventId(entry.getId());
        return entity;
    }

    public static HistoryEntry toDomain(FactureHistoryEntity entity) {
        return base(entity, String.valueOf(entity.getId()), entity.getPiecesJointes());
    }

    public static HistoryEntry toDomain(SupplyTicketHistoryEntity entity) {
        return base(entity, entity.getEventId() != null ? entity.getEventId() : String.valueOf(entity.getId()),
                entity.getPiecesJointes());
    }

    public static HistoryEntry toDomain(MissionHistoryEntity entity) {
        return base(entity, entity.getEventId() != null ? entity.getEventId() : String.valueOf(entity.getId()), List.of());
    }

    private static <E extends HistoryEntryEntity> E fill(E entity, HistoryEntry entry) {
        entity.setEventAt(entry.getAt());
        entity.setActor(entry.getActor() == null ? "" : entry.getActor());
        entity.setEmail(entry.getEmail());
        entity.setAction(entry.getAction());
        entity.setRole(entry.getRole());
        entity.setDetail(entry.getDetail());
        entity.setCommentaire(entry.getCommentaire() == null ? "" : entry.getCommentaire());
        return entity;
    }

    private static HistoryEntry base(HistoryEntryEntity entity, String id, List<String> attachments) {
        return HistoryEntry.builder()
                .id(id)
                .at(entity.getEventAt())
                .actor(entity.getActor())
                .email(entity.getEmail())
                .action(entity.getAction())
                .role(entity.getRole())
                .detail(entity.getDetail())
                .commentaire(entity.getCommentaire())
                .piecesJointes(new ArrayList<>(attachments))
                .build();
    }
}
