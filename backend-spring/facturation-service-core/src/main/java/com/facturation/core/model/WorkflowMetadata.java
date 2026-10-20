package com.facturation.core.model;

import java.util.List;
import java.util.Map;

public record WorkflowMetadata(
        List<String> factureStatuses,
        List<String> userRoles,
        Map<String, String> roleLabels,
        List<String> directions,
        List<String> workflowSteps,
        List<WorkflowAssignment> workflowAssignments,
        List<String> approStatuses,
        List<String> facturationStatuses) {
}
