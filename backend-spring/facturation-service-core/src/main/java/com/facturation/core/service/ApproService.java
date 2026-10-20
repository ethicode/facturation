package com.facturation.core.service;

import com.facturation.core.exception.BusinessException;
import com.facturation.core.model.ApproDomain;
import com.facturation.core.model.ApproState;
import com.facturation.core.model.BudgetDirection;
import com.facturation.core.model.BudgetItem;
import com.facturation.core.model.DeleteBudgetResult;
import com.facturation.core.model.DirfinHistoryEntry;
import com.facturation.core.model.HistoryEntry;
import com.facturation.core.model.SupplyTicket;
import com.facturation.core.model.command.BudgetItemCommand;
import com.facturation.core.model.command.BudgetUpsertCommand;
import com.facturation.core.model.command.SupplyTicketCreateCommand;
import com.facturation.core.port.ApproDomainGateway;
import com.facturation.core.port.BudgetGateway;
import com.facturation.core.port.DirectionGateway;
import com.facturation.core.port.DirfinHistoryGateway;
import com.facturation.core.port.FactureGateway;
import com.facturation.core.port.MissionGateway;
import com.facturation.core.port.SupplyTicketGateway;
import com.facturation.core.util.Identifiers;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Gestion budgétaire (allocations, lignes budgétaires) et tickets d'approvisionnement. */
@Service
@RequiredArgsConstructor
@Transactional
public class ApproService {

    static final String TICKET_INITIAL_STATUS = "Saisie de la demande";
    static final String TICKET_PROCESSING_STATUS = "Traitement service approvisionnement";
    static final String TICKET_MORE_INFO_STATUS =
            "Demande d'information complémentaire (Traitement service approvisionnement)";
    static final String TICKET_CLOSED_STATUS = "Clôturée";

    private final BudgetGateway budgetGateway;
    private final SupplyTicketGateway ticketGateway;
    private final DirfinHistoryGateway dirfinHistoryGateway;
    private final MissionGateway missionGateway;
    private final FactureGateway factureGateway;
    private final DirectionGateway directionGateway;
    private final ApproDomainGateway domainGateway;

    @Transactional(readOnly = true)
    public ApproState getState() {
        return new ApproState(
                budgetGateway.findAllBudgets(),
                ticketGateway.findAll(),
                dirfinHistoryGateway.findAll(),
                budgetGateway.findAllItems());
    }

    public ApproState saveBudget(BudgetUpsertCommand command) {
        String direction = Identifiers.normalize(command.direction());
        if (!directionGateway.findAll().contains(direction)) {
            throw BusinessException.notFound("Direction introuvable.");
        }

        BudgetDirection existing = budgetGateway.findBudget(direction).orElse(null);
        BudgetDirection budget = BudgetDirection.builder()
                .direction(direction)
                .allocated(command.allocated())
                .engaged(command.engaged())
                .allocatedBy(command.allocatedBy())
                .build();
        budgetGateway.saveBudget(budget);

        if (existing == null) {
            recordDirfinEvent(command.actor(), "Nouvelle allocation budgetaire creee",
                    "Allocation initiale pour %s: %s alloue, %s engage"
                            .formatted(direction, plain(budget.getAllocated()), plain(budget.getEngaged())));
        } else {
            recordDirfinEvent(command.actor(), "Allocation budgetaire mise a jour",
                    "Direction %s: %s -> %s; engage %s -> %s".formatted(direction,
                            plain(existing.getAllocated()), plain(command.allocated()),
                            plain(existing.getEngaged()), plain(command.engaged())));
        }
        return getState();
    }

    public ApproState createBudgetItem(BudgetItemCommand command) {
        String direction = Identifiers.normalize(command.direction());
        String label = Identifiers.normalize(command.label());
        BudgetDirection budget = budgetGateway.findBudget(direction)
                .orElseThrow(() -> BusinessException.notFound("Aucune allocation trouvée pour cette direction."));
        validateBudgetItem(label, command.allocated());

        BudgetItem item = BudgetItem.builder()
                .id(Identifiers.eventId())
                .direction(direction)
                .label(label)
                .allocated(command.allocated())
                .createdAt(Instant.now())
                .createdBy(command.actor())
                .build();
        budgetGateway.saveItem(item);

        budget.setAllocated(budget.getAllocated().add(item.getAllocated()));
        budgetGateway.saveBudget(budget);
        recordDirfinEvent(command.actor(), "Ligne budgétaire ajoutée",
                "%s — %s: %s alloué".formatted(direction, label, plain(item.getAllocated())));
        return getState();
    }

    public ApproState updateBudgetItem(String itemId, BudgetItemCommand command) {
        BudgetItem item = budgetGateway.findItem(itemId)
                .orElseThrow(() -> BusinessException.notFound("Ligne budgétaire introuvable."));
        String label = Identifiers.normalize(command.label());
        validateBudgetItem(label, command.allocated());

        BigDecimal consumed = missionGateway.sumConsumedByBudgetItem(item.getId());
        if (command.allocated().compareTo(consumed) < 0) {
            throw BusinessException.badRequest(
                    "Le montant alloué ne peut pas être inférieur au montant déjà consommé (%s).".formatted(plain(consumed)));
        }

        BudgetDirection budget = budgetGateway.findBudget(item.getDirection())
                .orElseThrow(() -> BusinessException.notFound("Aucune allocation trouvée pour cette direction."));

        String previousLabel = item.getLabel();
        BigDecimal previousAmount = item.getAllocated();
        item.setLabel(label);
        item.setAllocated(command.allocated());
        item.setUpdatedAt(Instant.now());
        item.setUpdatedBy(command.actor());
        budgetGateway.saveItem(item);

        budget.setAllocated(budget.getAllocated().add(item.getAllocated()).subtract(previousAmount));
        budgetGateway.saveBudget(budget);
        recordDirfinEvent(command.actor(), "Ligne budgétaire modifiée", "%s — %s → %s; %s → %s".formatted(
                item.getDirection(), previousLabel, label, plain(previousAmount), plain(item.getAllocated())));
        return getState();
    }

    public ApproState deleteBudgetItem(String itemId, String actor) {
        BudgetItem item = budgetGateway.findItem(itemId)
                .orElseThrow(() -> BusinessException.notFound("Ligne budgétaire introuvable."));
        if (missionGateway.existsByBudgetItemIdIn(List.of(itemId))) {
            throw BusinessException.badRequest(
                    "Cette ligne budgétaire est référencée par une ou plusieurs missions et ne peut pas être supprimée.");
        }
        BudgetDirection budget = budgetGateway.findBudget(item.getDirection())
                .orElseThrow(() -> BusinessException.notFound("Aucune allocation trouvée pour cette direction."));

        budgetGateway.deleteItem(itemId);
        budget.setAllocated(budget.getAllocated().subtract(item.getAllocated()));
        budgetGateway.saveBudget(budget);
        recordDirfinEvent(actor, "Ligne budgétaire supprimée",
                "%s — %s: %s retiré".formatted(item.getDirection(), item.getLabel(), plain(item.getAllocated())));
        return getState();
    }

    public DeleteBudgetResult deleteBudget(String direction, String actor) {
        boolean linkedTickets = ticketGateway.findAll().stream()
                .anyMatch(ticket -> Objects.equals(ticket.getDirection(), direction));
        if (linkedTickets) {
            return new DeleteBudgetResult(getState(),
                    "Impossible de supprimer: des tickets approvisionnement sont lies a cette direction.");
        }

        Set<String> itemIds = budgetGateway.findItemsByDirection(direction).stream()
                .map(BudgetItem::getId)
                .collect(Collectors.toSet());
        if (!itemIds.isEmpty() && missionGateway.existsByBudgetItemIdIn(itemIds)) {
            return new DeleteBudgetResult(getState(),
                    "Impossible de supprimer: des missions consomment une ou plusieurs lignes budgétaires de cette direction.");
        }

        budgetGateway.deleteBudget(direction);
        recordDirfinEvent(actor, "Allocation budgetaire supprimee", "Suppression de " + direction);
        return new DeleteBudgetResult(getState(), "");
    }

    public SupplyTicket createTicket(SupplyTicketCreateCommand command) {
        String direction = firstNonBlank(command.directionDemandeur(), command.direction());
        String title = firstNonBlank(command.titreDemande(), command.objet());
        BigDecimal budgetPrevisionnel = zeroIfNull(command.budgetPrevisionnel());
        BigDecimal amount = budgetPrevisionnel.signum() > 0 ? budgetPrevisionnel : zeroIfNull(command.montant());

        if (direction.isEmpty() || title.isEmpty() || amount.signum() <= 0) {
            throw BusinessException.badRequest("Champs obligatoires invalides pour le ticket approvisionnement.");
        }

        String domainValue = Identifiers.normalize(command.domaine());
        String subdomainValue = Identifiers.normalize(command.sousDomaine());
        if (domainValue.isEmpty() || subdomainValue.isEmpty()) {
            throw BusinessException.badRequest("Le domaine et le sous-domaine sont obligatoires.");
        }

        ApproDomain domain = domainGateway.findAll().stream()
                .filter(candidate -> candidate.name().equalsIgnoreCase(domainValue))
                .findFirst()
                .orElseThrow(() -> BusinessException.badRequest("Le domaine sélectionné est invalide."));
        String subdomain = domain.subdomains().stream()
                .filter(candidate -> candidate.equalsIgnoreCase(subdomainValue))
                .findFirst()
                .orElseThrow(() -> BusinessException.badRequest(
                        "Le sous-domaine ne correspond pas au domaine sélectionné."));

        HistoryEntry creation = HistoryEntry.builder()
                .id(Identifiers.eventId())
                .at(Instant.now())
                .actor(command.actor())
                .action("Statut passé à " + TICKET_INITIAL_STATUS)
                .commentaire("Ticket créé en approvisionnement.")
                .build();

        SupplyTicket ticket = SupplyTicket.builder()
                .id(Identifiers.yearlyReference("TCK", ticketGateway.findAllIds()))
                .direction(direction)
                .objet(title)
                .montant(amount)
                .devise(command.devise())
                .titreDemande(Identifiers.normalize(command.titreDemande()))
                .domaine(domain.name())
                .sousDomaine(subdomain)
                .actionDemande(Identifiers.normalize(command.actionDemande()))
                .dateDebutSouhaitee(Identifiers.normalize(command.dateDebutSouhaitee()))
                .dateFinSouhaitee(Identifiers.normalize(command.dateFinSouhaitee()))
                .directionDemandeur(direction)
                .budgetPrevisionnel(amount)
                .priorite(Identifiers.normalize(command.priorite()))
                .description(Identifiers.normalize(command.description()))
                .commentaire(Identifiers.normalize(command.commentaire()))
                .fichierNom(Identifiers.normalize(command.fichierNom()))
                .statut(TICKET_INITIAL_STATUS)
                .linkedFactureId("")
                .history(new ArrayList<>(List.of(creation)))
                .build();
        return ticketGateway.save(ticket);
    }

    /** Supprime le ticket ainsi que la facture éventuellement générée à partir de celui-ci. */
    public ApproState deleteTicket(String ticketId) {
        SupplyTicket ticket = findTicket(ticketId);
        if (!ticket.getLinkedFactureId().isEmpty()) {
            factureGateway.findById(ticket.getLinkedFactureId())
                    .ifPresent(facture -> factureGateway.deleteById(facture.getId()));
        }
        ticketGateway.deleteById(ticketId);
        return getState();
    }

    public ApproState verifyTicketBudget(String ticketId, String actor) {
        SupplyTicket ticket = findTicket(ticketId);
        BudgetDirection budget = budgetGateway.findBudget(ticket.getDirection()).orElse(null);
        if (budget == null) {
            return getState();
        }

        BigDecimal remaining = budget.getAllocated().subtract(budget.getEngaged());
        boolean valid = remaining.compareTo(ticket.getMontant()) >= 0;
        if (valid) {
            budget.setEngaged(budget.getEngaged().add(ticket.getMontant()));
            budgetGateway.saveBudget(budget);
        }

        changeTicketStatus(ticket,
                valid ? TICKET_PROCESSING_STATUS : TICKET_MORE_INFO_STATUS,
                actor,
                valid ? "Budget validé." : "Budget insuffisant - informations complémentaires requises.");
        return getState();
    }

    public ApproState closeTicket(String ticketId, String actor) {
        SupplyTicket ticket = findTicket(ticketId);
        if (TICKET_CLOSED_STATUS.equals(ticket.getStatut()) || !ticket.getLinkedFactureId().isEmpty()) {
            return getState();
        }
        changeTicketStatus(ticket, TICKET_CLOSED_STATUS, actor, "Ticket clôturé.");
        return getState();
    }

    private void changeTicketStatus(SupplyTicket ticket, String status, String actor, String comment) {
        if (Objects.equals(ticket.getStatut(), status)) {
            return;
        }
        ticket.setStatut(status);
        List<HistoryEntry> history = new ArrayList<>();
        history.add(HistoryEntry.builder()
                .id(Identifiers.eventId())
                .at(Instant.now())
                .actor(actor)
                .action("Statut passé à " + status)
                .commentaire(comment)
                .build());
        history.addAll(ticket.getHistory());
        ticket.setHistory(history);
        ticketGateway.save(ticket);
    }

    private SupplyTicket findTicket(String ticketId) {
        return ticketGateway.findById(ticketId).orElseThrow(() -> BusinessException.notFound("Ticket introuvable."));
    }

    private void recordDirfinEvent(String actor, String action, String detail) {
        dirfinHistoryGateway.add(DirfinHistoryEntry.builder()
                .id(Identifiers.eventId())
                .at(Instant.now())
                .actor(actor)
                .action(action)
                .detail(detail)
                .build());
    }

    private static void validateBudgetItem(String label, BigDecimal allocated) {
        if (label.isEmpty()) {
            throw BusinessException.badRequest("Le libellé de la ligne budgétaire est obligatoire.");
        }
        if (allocated == null || allocated.signum() <= 0) {
            throw BusinessException.badRequest("Le montant de la ligne budgétaire doit être supérieur à zéro.");
        }
    }

    private static String plain(BigDecimal value) {
        return value == null ? "0" : value.stripTrailingZeros().toPlainString();
    }

    private static BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static String firstNonBlank(String value, String fallback) {
        String normalized = Identifiers.normalize(value);
        return normalized.isEmpty() ? Identifiers.normalize(fallback) : normalized;
    }
}
