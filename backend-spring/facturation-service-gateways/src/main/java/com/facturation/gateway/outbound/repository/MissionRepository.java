package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.MissionEntity;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MissionRepository extends JpaRepository<MissionEntity, String> {

    List<MissionEntity> findAllByOrderByPositionAsc();

    @Query("select m.code from MissionEntity m")
    List<String> findAllCodes();

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByBudgetItemIdIn(Collection<String> budgetItemIds);

    @Query("select coalesce(sum(m.budgetConsumed), 0) from MissionEntity m where m.budgetItemId = :budgetItemId")
    BigDecimal sumConsumedByBudgetItem(@Param("budgetItemId") String budgetItemId);

    @Query("select coalesce(min(m.position), 0) from MissionEntity m")
    int findMinPosition();
}
