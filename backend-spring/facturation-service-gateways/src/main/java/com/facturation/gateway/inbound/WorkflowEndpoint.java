package com.facturation.gateway.inbound;

import com.facturation.api.WorkflowAPI;
import com.facturation.api.model.RequestContext;
import com.facturation.api.model.WorkflowMetadataResponse;
import com.facturation.api.usecases.GetWorkflowMetadata;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class WorkflowEndpoint implements WorkflowAPI {

    private final GetWorkflowMetadata getWorkflowMetadata;

    @Override
    public WorkflowMetadataResponse workflowMetadata(RequestContext ctx) {
        return getWorkflowMetadata.workflowMetadata(ctx);
    }
}
