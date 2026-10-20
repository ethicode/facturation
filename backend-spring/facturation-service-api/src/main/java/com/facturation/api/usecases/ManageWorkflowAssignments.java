package com.facturation.api.usecases;

import com.facturation.api.model.RequestContext;
import com.facturation.api.model.WorkflowStepAssignment;
import java.util.List;

public interface ManageWorkflowAssignments {

    List<WorkflowStepAssignment> listWorkflowAssignments(RequestContext ctx);

    WorkflowStepAssignment saveWorkflowAssignment(WorkflowStepAssignment input, RequestContext ctx);

    WorkflowStepAssignment updateWorkflowAssignment(String step, WorkflowStepAssignment input, RequestContext ctx);

    List<WorkflowStepAssignment> deleteWorkflowAssignment(String step, String workflowType, RequestContext ctx);
}
