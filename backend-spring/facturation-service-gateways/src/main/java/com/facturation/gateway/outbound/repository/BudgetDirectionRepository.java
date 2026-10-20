package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.BudgetDirectionEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface BudgetDirectionRepository extends JpaRepository<BudgetDirectionEntity, String> {

    List<BudgetDirectionEntity> findAllByOrderByPositionAsc();

    boolean existsByDirectionIgnoreCase(String direction);

    @Query("select coalesce(min(b.position), 0) from BudgetDirectionEntity b")
    int findMinPosition();
}
