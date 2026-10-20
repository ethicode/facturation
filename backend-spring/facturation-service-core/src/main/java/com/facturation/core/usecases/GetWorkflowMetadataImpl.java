package com.facturation.core.usecases;

import com.facturation.api.model.RequestContext;
import com.facturation.api.model.WorkflowMetadataResponse;
import com.facturation.api.usecases.GetWorkflowMetadata;
import com.facturation.core.mapper.ResponseMapper;
import com.facturation.core.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetWorkflowMetadataImpl implements GetWorkflowMetadata {

    private final WorkflowService workflowService;

    @Override
    public WorkflowMetadataResponse workflowMetadata(RequestContext ctx) {
        return ResponseMapper.toResponse(workflowService.metadata());
    }
}
