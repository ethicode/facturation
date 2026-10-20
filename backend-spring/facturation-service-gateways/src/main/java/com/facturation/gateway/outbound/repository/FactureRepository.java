package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.FactureEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface FactureRepository extends JpaRepository<FactureEntity, String> {

    List<FactureEntity> findAllByOrderByPositionAsc();

    @Query("select f.id from FactureEntity f")
    List<String> findAllIds();

    @Query("select coalesce(min(f.position), 0) from FactureEntity f")
    int findMinPosition();
}
