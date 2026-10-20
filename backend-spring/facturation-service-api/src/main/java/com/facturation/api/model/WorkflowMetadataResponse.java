package com.facturation.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record WorkflowMetadataResponse(
        @JsonProperty("facture_statuses") List<String> factureStatuses,
        @JsonProperty("user_roles") List<String> userRoles,
        @JsonProperty("role_labels") Map<String, String> roleLabels,
        List<String> directions,
        @JsonProperty("workflow_steps") List<String> workflowSteps,
        @JsonProperty("workflow_assignments") List<WorkflowStepAssignment> workflowAssignments,
        @JsonProperty("appro_statuses") List<String> approStatuses,
        @JsonProperty("facturation_statuses") List<String> facturationStatuses) {
}
