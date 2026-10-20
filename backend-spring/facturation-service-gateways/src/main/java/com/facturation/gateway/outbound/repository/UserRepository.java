package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.UserEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<UserEntity, String> {

    List<UserEntity> findAllByOrderByPositionAsc();

    Optional<UserEntity> findByUsernameIgnoreCase(String username);

    @Query("""
            select count(u) > 0 from UserEntity u
            where lower(u.email) = lower(:email) and (:excludedId is null or u.id <> :excludedId)
            """)
    boolean existsByEmailIgnoreCaseExcluding(@Param("email") String email, @Param("excludedId") String excludedId);

    @Query("select u.id from UserEntity u")
    List<String> findAllIds();

    @Query("select coalesce(min(u.position), 0) from UserEntity u")
    int findMinPosition();
}
