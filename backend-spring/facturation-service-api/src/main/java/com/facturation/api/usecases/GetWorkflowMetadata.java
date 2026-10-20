package com.facturation.api.usecases;

import com.facturation.api.model.RequestContext;
import com.facturation.api.model.WorkflowMetadataResponse;

public interface GetWorkflowMetadata {

    WorkflowMetadataResponse workflowMetadata(RequestContext ctx);
}
