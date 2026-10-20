package com.facturation.core.model;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirfinHistoryEntry {
    private String id;
    private Instant at;
    private String actor;
    private String action;
    @Builder.Default
    private String detail = "";
}
