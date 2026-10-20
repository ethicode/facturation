package com.facturation.core.service;

import com.facturation.core.exception.BusinessException;
import com.facturation.core.model.Facture;
import com.facturation.core.model.HistoryEntry;
import com.facturation.core.model.command.FactureCreateCommand;
import com.facturation.core.model.command.FactureStatusCommand;
import com.facturation.core.port.FactureGateway;
import com.facturation.core.port.SupplyTicketGateway;
import com.facturation.core.util.Identifiers;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FactureService {

    static final String STATUS_AFTER_CREATION = "Vérification métier";
    static final String STATUS_PAYMENT_DONE = "Paiement effectué";
    static final String STATUS_CLOSED = "Clôturée";
    static final String TICKET_TRANSFERRED_STATUS = "Transférée en facturation";
    static final String TICKET_INITIAL_STATUS = "Saisie de la demande";

    private final FactureGateway factureGateway;
    private final SupplyTicketGateway ticketGateway;

    @Transactional(readOnly = true)
    public List<Facture> list() {
        return factureGateway.findAll();
    }

    @Transactional(readOnly = true)
    public Facture get(String id) {
        return factureGateway.findById(id).orElseThrow(() -> BusinessException.notFound("Facture introuvable."));
    }

    public Facture create(FactureCreateCommand command) {
        String receptionDate = firstNonBlank(command.dateReception(), command.echeance());
        String chargeAccount = firstNonBlank(command.compteCharge(), command.centreCout());
        List<String> attachments = cleanAttachments(command.piecesJointes());

        HistoryEntry creation = HistoryEntry.builder()
                .at(Instant.now())
                .actor(command.actor())
                .email(command.email())
                .role(command.role())
                .action("Demande soumise et étape de saisie validée automatiquement")
                .piecesJointes(new ArrayList<>(attachments))
                .build();

        Facture facture = Facture.builder()
                .id(Identifiers.yearlyReference("FAC", factureGateway.findAllIds()))
                .fournisseur(command.fournisseur())
                .montant(command.montant())
                .devise(command.devise())
                .centreCout(chargeAccount)
                .description(command.description())
                .echeance(receptionDate)
                .priorite(Identifiers.normalize(command.priorite()))
                .direction(Identifiers.normalize(command.direction()))
                .resume(Identifiers.normalize(command.resume()))
                .numeroFacture(Identifiers.normalize(command.numeroFacture()))
                .compteCharge(chargeAccount)
                .dateReception(receptionDate)
                .modeReception(Identifiers.normalize(command.modeReception()))
                .piecesJointes(attachments)
                .statut(STATUS_AFTER_CREATION)
                .history(new ArrayList<>(List.of(creation)))
                .build();
        return factureGateway.save(facture);
    }

    /** Supprime la facture et détache les tickets d'approvisionnement qui y étaient liés. */
    public List<Facture> delete(String id) {
        get(id);
        ticketGateway.findByLinkedFactureId(id).forEach(ticket -> {
            ticket.setLinkedFactureId("");
            if (TICKET_TRANSFERRED_STATUS.equals(ticket.getStatut())) {
                ticket.setStatut(TICKET_INITIAL_STATUS);
            }
            ticketGateway.save(ticket);
        });
        factureGateway.deleteById(id);
        return factureGateway.findAll();
    }

    public Facture updateStatus(String id, FactureStatusCommand command) {
        Facture facture = get(id);
        String comment = Identifiers.normalize(command.commentaire());
        List<String> attachments = cleanAttachments(command.piecesJointes());
        String previousStatus = facture.getStatut();
        String nextStatus = command.nextStatus();
        Instant now = Instant.now();

        String actionLabel;
        if (STATUS_PAYMENT_DONE.equals(nextStatus)) {
            facture.setStatut(STATUS_CLOSED);
            actionLabel = firstNonBlank(command.actionLabel(), "Paiement effectué - clôture automatique");
        } else {
            facture.setStatut(nextStatus);
            actionLabel = firstNonBlank(command.actionLabel(), "Statut passe a " + nextStatus);
        }

        List<HistoryEntry> newEntries = new ArrayList<>();
        if (previousStatus != null && !previousStatus.isEmpty() && !Objects.equals(previousStatus, nextStatus)) {
            // L'étape quittée est tracée avec le commentaire et les pièces jointes de la décision.
            newEntries.add(historyEntry(command, previousStatus, comment, attachments, now));
        }
        newEntries.add(historyEntry(command, actionLabel, comment, List.of(), now));

        List<HistoryEntry> history = new ArrayList<>(newEntries);
        history.addAll(facture.getHistory());
        facture.setHistory(history);
        return factureGateway.save(facture);
    }

    private static HistoryEntry historyEntry(FactureStatusCommand command, String action, String comment,
                                             List<String> attachments, Instant at) {
        return HistoryEntry.builder()
                .at(at)
                .actor(command.actor())
                .email(command.email())
                .role(command.role())
                .action(action)
                .commentaire(comment)
                .piecesJointes(new ArrayList<>(attachments))
                .build();
    }

    private static List<String> cleanAttachments(List<String> attachments) {
        if (attachments == null) {
            return new ArrayList<>();
        }
        return new ArrayList<>(attachments.stream().filter(name -> name != null && !name.isBlank()).toList());
    }

    private static String firstNonBlank(String value, String fallback) {
        return value != null && !value.isBlank() ? value : fallback;
    }
}
