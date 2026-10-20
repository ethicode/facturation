package com.facturation.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record WorkflowStepAssignment(
        String step,
        @JsonProperty("user_ids") List<String> userIds,
        @JsonProperty("workflow_type") String workflowType) {
}
