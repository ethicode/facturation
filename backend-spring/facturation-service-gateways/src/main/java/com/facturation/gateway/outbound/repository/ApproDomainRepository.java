package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.ApproDomainEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ApproDomainRepository extends JpaRepository<ApproDomainEntity, String> {

    List<ApproDomainEntity> findAllByOrderByPositionAsc();

    @Query("select coalesce(max(d.position), -1) from ApproDomainEntity d")
    int findMaxPosition();
}
