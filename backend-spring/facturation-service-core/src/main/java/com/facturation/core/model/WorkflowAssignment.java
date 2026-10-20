package com.facturation.core.model;

import java.util.List;

public record WorkflowAssignment(String workflowType, String step, List<String> userIds) {
}
