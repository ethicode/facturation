package com.facturation.gateway.outbound.adapter;

import com.facturation.core.model.WorkflowAssignment;
import com.facturation.core.port.WorkflowAssignmentGateway;
import com.facturation.gateway.outbound.entity.WorkflowAssignmentEntity;
import com.facturation.gateway.outbound.repository.WorkflowAssignmentRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Une ligne par utilisateur affecté ; regroupées par (workflow, étape) côté domaine. */
@Component
@RequiredArgsConstructor
public class WorkflowAssignmentGatewayAdapter implements WorkflowAssignmentGateway {

    private final WorkflowAssignmentRepository repository;

    @Override
    public List<WorkflowAssignment> findAll() {
        Map<WorkflowKey, List<String>> grouped = new LinkedHashMap<>();
        for (WorkflowAssignmentEntity entity : repository.findAllOrdered()) {
            WorkflowAssignmentEntity.Key key = entity.getId();
            grouped.computeIfAbsent(new WorkflowKey(key.getWorkflowType(), key.getStep()), ignored -> new ArrayList<>())
                    .add(key.getUserId());
        }
        return grouped.entrySet().stream()
                .map(entry -> new WorkflowAssignment(entry.getKey().workflowType(), entry.getKey().step(),
                        List.copyOf(entry.getValue())))
                .toList();
    }

    @Override
    public WorkflowAssignment save(WorkflowAssignment assignment) {
        repository.deleteStep(assignment.workflowType(), assignment.step());
        List<WorkflowAssignmentEntity> entities = new ArrayList<>();
        for (int index = 0; index < assignment.userIds().size(); index++) {
            WorkflowAssignmentEntity entity = new WorkflowAssignmentEntity();
            entity.setId(new WorkflowAssignmentEntity.Key(assignment.workflowType(), assignment.step(),
                    assignment.userIds().get(index)));
            entity.setPosition(index);
            entities.add(entity);
        }
        repository.saveAllAndFlush(entities);
        return assignment;
    }

    @Override
    public void delete(String workflowType, String step) {
        repository.deleteStep(workflowType, step);
    }

    private record WorkflowKey(String workflowType, String step) {
    }
}
