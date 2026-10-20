package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.TraceEventEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TraceEventRepository extends JpaRepository<TraceEventEntity, Long> {

    List<TraceEventEntity> findAllByOrderByPositionAsc();
}
