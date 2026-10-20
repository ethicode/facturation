package com.facturation.core.usecases;

import com.facturation.api.model.RequestContext;
import com.facturation.api.model.WorkflowStepAssignment;
import com.facturation.api.usecases.ManageWorkflowAssignments;
import com.facturation.core.mapper.ResponseMapper;
import com.facturation.core.service.WorkflowService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ManageWorkflowAssignmentsImpl implements ManageWorkflowAssignments {

    private final WorkflowService workflowService;

    @Override
    public List<WorkflowStepAssignment> listWorkflowAssignments(RequestContext ctx) {
        return ResponseMapper.toAssignments(workflowService.listAssignments());
    }

    @Override
    public WorkflowStepAssignment saveWorkflowAssignment(WorkflowStepAssignment input, RequestContext ctx) {
        return updateWorkflowAssignment(input.step(), input, ctx);
    }

    @Override
    public WorkflowStepAssignment updateWorkflowAssignment(String step, WorkflowStepAssignment input,
                                                           RequestContext ctx) {
        return ResponseMapper.toResponse(workflowService.saveAssignment(step, input.userIds(), input.workflowType()));
    }

    @Override
    public List<WorkflowStepAssignment> deleteWorkflowAssignment(String step, String workflowType, RequestContext ctx) {
        return ResponseMapper.toAssignments(workflowService.deleteAssignment(step, workflowType));
    }
}
