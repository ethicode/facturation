package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.SupplyTicketEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SupplyTicketRepository extends JpaRepository<SupplyTicketEntity, String> {

    List<SupplyTicketEntity> findAllByOrderByPositionAsc();

    List<SupplyTicketEntity> findByLinkedFactureId(String linkedFactureId);

    @Query("select t.id from SupplyTicketEntity t")
    List<String> findAllIds();

    @Query("select coalesce(min(t.position), 0) from SupplyTicketEntity t")
    int findMinPosition();

    boolean existsByDirectionIgnoreCase(String direction);

    boolean existsByDomaineIgnoreCase(String domaine);

    boolean existsByDomaineIgnoreCaseAndSousDomaineIgnoreCase(String domaine, String sousDomaine);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update SupplyTicketEntity t set t.sousDomaine = :nextName
            where lower(t.domaine) = lower(:domain) and lower(t.sousDomaine) = lower(:currentName)
            """)
    int renameSubdomain(@Param("domain") String domain,
                        @Param("currentName") String currentName,
                        @Param("nextName") String nextName);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update SupplyTicketEntity t set t.direction = :nextName where lower(t.direction) = lower(:currentName)")
    int renameDirection(@Param("currentName") String currentName, @Param("nextName") String nextName);
}
