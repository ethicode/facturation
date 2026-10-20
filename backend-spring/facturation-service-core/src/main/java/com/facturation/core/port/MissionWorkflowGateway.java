package com.facturation.core.port;

import com.facturation.core.model.WorkflowTransition;
import java.util.List;

public interface MissionWorkflowGateway {

    List<WorkflowTransition> findTransitions();
}
