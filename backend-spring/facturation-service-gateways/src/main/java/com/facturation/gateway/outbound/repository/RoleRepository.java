package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.RoleEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface RoleRepository extends JpaRepository<RoleEntity, String> {

    List<RoleEntity> findAllByOrderByPositionAsc();

    @Query("select coalesce(max(r.position), -1) from RoleEntity r")
    int findMaxPosition();
}
