package com.facturation.api.model;

import java.util.List;

public record HistoryEntryResponse(
        String id,
        String at,
        String actor,
        String email,
        String action,
        String role,
        String detail,
        String commentaire,
        List<String> piecesJointes) {
}
