package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.KpiMetricEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KpiMetricRepository extends JpaRepository<KpiMetricEntity, Long> {

    List<KpiMetricEntity> findAllByOrderByPositionAsc();
}
