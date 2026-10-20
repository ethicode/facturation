package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.DirfinHistoryEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DirfinHistoryRepository extends JpaRepository<DirfinHistoryEntity, String> {

    List<DirfinHistoryEntity> findAllByOrderByPositionAsc();

    @Query("select coalesce(min(h.position), 0) from DirfinHistoryEntity h")
    int findMinPosition();
}
