package com.facturation.core.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryEntry {
    private String id;
    private Instant at;
    private String actor;
    private String email;
    private String action;
    private String role;
    private String detail;
    @Builder.Default
    private String commentaire = "";
    @Builder.Default
    private List<String> piecesJointes = new ArrayList<>();
}
