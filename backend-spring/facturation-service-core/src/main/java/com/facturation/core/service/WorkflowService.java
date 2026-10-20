package com.facturation.core.service;

import com.facturation.core.exception.BusinessException;
import com.facturation.core.model.Role;
import com.facturation.core.model.WorkflowAssignment;
import com.facturation.core.model.WorkflowMetadata;
import com.facturation.core.port.DirectionGateway;
import com.facturation.core.port.RoleGateway;
import com.facturation.core.port.StatusCatalogGateway;
import com.facturation.core.port.UserGateway;
import com.facturation.core.port.WorkflowAssignmentGateway;
import com.facturation.core.util.Identifiers;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Métadonnées des workflows et affectation des utilisateurs aux étapes. */
@Service
@RequiredArgsConstructor
@Transactional
public class WorkflowService {

    static final String DEFAULT_WORKFLOW_TYPE = "facturation";

    private final StatusCatalogGateway statusCatalogGateway;
    private final RoleGateway roleGateway;
    private final DirectionGateway directionGateway;
    private final WorkflowAssignmentGateway assignmentGateway;
    private final UserGateway userGateway;

    @Transactional(readOnly = true)
    public WorkflowMetadata metadata() {
        List<String> facturationStatuses = statusCatalogGateway.findStatuses(StatusCatalogGateway.FACTURATION);
        List<Role> roles = roleGateway.findAll();
        Map<String, String> roleLabels = new LinkedHashMap<>();
        roles.forEach(role -> roleLabels.put(role.code(), role.label()));

        return new WorkflowMetadata(
                facturationStatuses,
                roles.stream().map(Role::code).toList(),
                roleLabels,
                directionGateway.findAll(),
                facturationStatuses,
                assignmentGateway.findAll(),
                statusCatalogGateway.findStatuses(StatusCatalogGateway.APPRO),
                facturationStatuses);
    }

    @Transactional(readOnly = true)
    public List<WorkflowAssignment> listAssignments() {
        return assignmentGateway.findAll();
    }

    public WorkflowAssignment saveAssignment(String step, List<String> userIds, String workflowType) {
        String normalizedStep = Identifiers.normalize(step);
        String normalizedType = defaultType(workflowType);
        if (normalizedStep.isEmpty()) {
            throw BusinessException.badRequest("L'étape du workflow est obligatoire.");
        }

        Set<String> validSteps = new HashSet<>(statusCatalogGateway.findStatuses(StatusCatalogGateway.APPRO));
        validSteps.addAll(statusCatalogGateway.findStatuses(StatusCatalogGateway.FACTURATION));
        if (!validSteps.contains(normalizedStep)) {
            throw BusinessException.badRequest("L'étape du workflow est inconnue.");
        }

        Set<String> normalizedUserIds = new LinkedHashSet<>();
        if (userIds != null) {
            userIds.stream().filter(id -> id != null && !id.isBlank()).forEach(normalizedUserIds::add);
        }
        if (!new HashSet<>(userGateway.findAllIds()).containsAll(normalizedUserIds)) {
            throw BusinessException.badRequest("Un ou plusieurs identifiants utilisateur sont introuvables.");
        }

        return assignmentGateway.save(new WorkflowAssignment(normalizedType, normalizedStep, List.copyOf(normalizedUserIds)));
    }

    public List<WorkflowAssignment> deleteAssignment(String step, String workflowType) {
        String normalizedStep = Identifiers.normalize(step);
        if (normalizedStep.isEmpty()) {
            throw BusinessException.badRequest("L'étape du workflow est obligatoire.");
        }
        assignmentGateway.delete(defaultType(workflowType), normalizedStep);
        return assignmentGateway.findAll();
    }

    private static String defaultType(String workflowType) {
        String normalized = Identifiers.normalize(workflowType);
        return normalized.isEmpty() ? DEFAULT_WORKFLOW_TYPE : normalized;
    }
}
