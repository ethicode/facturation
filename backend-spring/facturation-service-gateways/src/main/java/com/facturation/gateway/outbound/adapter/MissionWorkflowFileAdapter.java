package com.facturation.gateway.outbound.adapter;

import com.facturation.core.model.WorkflowTransition;
import com.facturation.core.port.MissionWorkflowGateway;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

/** Lit les transitions du workflow de frais de mission depuis fraisDeMissionWorkflow.json. */
@Component
public class MissionWorkflowFileAdapter implements MissionWorkflowGateway {

    private final Resource definition;
    private final ObjectMapper objectMapper;

    public MissionWorkflowFileAdapter(@Value("${app.workflow.mission-definition}") Resource definition,
                                      ObjectMapper objectMapper) {
        this.definition = definition;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<WorkflowTransition> findTransitions() {
        try (InputStream input = definition.getInputStream()) {
            JsonNode root = objectMapper.readTree(input);
            List<WorkflowTransition> transitions = new ArrayList<>();
            root.path("transitions").forEach(node ->
                    transitions.add(new WorkflowTransition(node.path("from").asText(), node.path("to").asText())));
            return transitions;
        } catch (IOException exception) {
            throw new UncheckedIOException("Impossible de lire le workflow de mission: " + definition, exception);
        }
    }
}
