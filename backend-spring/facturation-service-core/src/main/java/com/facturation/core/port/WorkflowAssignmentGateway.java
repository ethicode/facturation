package com.facturation.core.port;

import com.facturation.core.model.WorkflowAssignment;
import java.util.List;

public interface WorkflowAssignmentGateway {

    List<WorkflowAssignment> findAll();

    /** Remplace la liste des utilisateurs affectés à l'étape. */
    WorkflowAssignment save(WorkflowAssignment assignment);

    void delete(String workflowType, String step);
}
