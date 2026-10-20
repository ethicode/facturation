package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.BudgetLineEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetLineRepository extends JpaRepository<BudgetLineEntity, String> {

    List<BudgetLineEntity> findAllByOrderByPositionAsc();
}
