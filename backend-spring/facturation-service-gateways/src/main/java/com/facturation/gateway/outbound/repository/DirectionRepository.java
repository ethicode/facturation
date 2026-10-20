package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.DirectionEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DirectionRepository extends JpaRepository<DirectionEntity, String> {

    List<DirectionEntity> findAllByOrderByPositionAsc();

    @Query("select coalesce(max(d.position), -1) from DirectionEntity d")
    int findMaxPosition();
}
