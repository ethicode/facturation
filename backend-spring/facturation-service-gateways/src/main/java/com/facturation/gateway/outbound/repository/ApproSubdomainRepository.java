package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.ApproSubdomainEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApproSubdomainRepository extends JpaRepository<ApproSubdomainEntity, ApproSubdomainEntity.Key> {

    @Query("select s from ApproSubdomainEntity s order by s.id.domainName, s.position")
    List<ApproSubdomainEntity> findAllOrdered();

    @Query("select coalesce(max(s.position), -1) from ApproSubdomainEntity s where s.id.domainName = :domain")
    int findMaxPosition(@Param("domain") String domain);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from ApproSubdomainEntity s where s.id.domainName = :domain")
    void deleteByDomain(@Param("domain") String domain);
}
