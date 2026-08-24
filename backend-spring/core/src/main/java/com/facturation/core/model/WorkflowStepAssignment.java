package com.facturation.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkflowStepAssignment {
    public String step;
    public List<String> userIds = new ArrayList<>();
    public String workflowType = "facturation";
}
