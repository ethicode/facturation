package com.facturation.core.model;

/** Transition déclarée dans la définition JSON du workflow de frais de mission. */
public record WorkflowTransition(String from, String to) {
}
