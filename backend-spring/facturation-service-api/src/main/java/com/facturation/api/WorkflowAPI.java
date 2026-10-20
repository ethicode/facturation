package com.facturation.api;

import com.facturation.api.model.RequestContext;
import com.facturation.api.model.WorkflowMetadataResponse;
import com.facturation.api.usecases.GetWorkflowMetadata;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping(produces = "application/json")
public interface WorkflowAPI extends GetWorkflowMetadata {

    @GetMapping("/api/meta/workflow")
    @Override
    WorkflowMetadataResponse workflowMetadata(RequestContext ctx);
}
