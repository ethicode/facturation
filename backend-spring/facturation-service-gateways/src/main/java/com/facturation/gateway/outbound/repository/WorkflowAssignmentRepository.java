package com.facturation.gateway.outbound.repository;

import com.facturation.gateway.outbound.entity.WorkflowAssignmentEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkflowAssignmentRepository
        extends JpaRepository<WorkflowAssignmentEntity, WorkflowAssignmentEntity.Key> {

    @Query("select a from WorkflowAssignmentEntity a order by a.id.workflowType, a.id.step, a.position")
    List<WorkflowAssignmentEntity> findAllOrdered();

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from WorkflowAssignmentEntity a where a.id.workflowType = :type and a.id.step = :step")
    void deleteStep(@Param("type") String workflowType, @Param("step") String step);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from WorkflowAssignmentEntity a where a.id.userId = :userId")
    void deleteByUserId(@Param("userId") String userId);
}
