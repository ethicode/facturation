package com.facturation.gateway.outbound.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "facture_history")
public class FactureHistoryEntity extends HistoryEntryEntity {

    @ElementCollection
    @CollectionTable(name = "facture_history_attachments", joinColumns = @JoinColumn(name = "history_id"))
    @OrderColumn(name = "position")
    @Column(name = "filename", nullable = false)
    private List<String> piecesJointes = new ArrayList<>();
}
