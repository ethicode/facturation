package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.StatusCatalogEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StatusCatalogRepository extends JpaRepository<StatusCatalogEntity, StatusCatalogEntity.Key> {

    @Query("select s.id.status from StatusCatalogEntity s where s.id.workflow = :workflow order by s.position")
    List<String> findStatuses(@Param("workflow") String workflow);
}
