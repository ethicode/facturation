package com.facturation.core.model.command;

import java.util.List;

public record FactureStatusCommand(
        String nextStatus,
        String actor,
        String email,
        String role,
        String actionLabel,
        String commentaire,
        List<String> piecesJointes) {
}
