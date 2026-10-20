package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.BudgetItemEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface BudgetItemRepository extends JpaRepository<BudgetItemEntity, String> {

    List<BudgetItemEntity> findAllByOrderByPositionAsc();

    List<BudgetItemEntity> findByDirectionOrderByPositionAsc(String direction);

    @Query("select coalesce(min(i.position), 0) from BudgetItemEntity i")
    int findMinPosition();

    @Modifying(flushAutomatically = true)
    void deleteByDirection(String direction);
}
