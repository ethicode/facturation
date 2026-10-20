package com.facturation.core.service;

import com.facturation.core.exception.BusinessException;
import com.facturation.core.model.BudgetItem;
import com.facturation.core.model.HistoryEntry;
import com.facturation.core.model.Mission;
import com.facturation.core.model.command.MissionCreateCommand;
import com.facturation.core.model.command.MissionStatusCommand;
import com.facturation.core.port.BudgetGateway;
import com.facturation.core.port.MissionGateway;
import com.facturation.core.port.MissionWorkflowGateway;
import com.facturation.core.util.Identifiers;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class MissionService {

    static final String STATUS_CREATION = "Creation";
    static final String STATUS_FIRST_VALIDATION = "Validation responsable metier";
    static final String STATUS_RETURN_FIRST_VALIDATION = "Retour demande (Validation responsable metier)";

    /** Anciens libellés de statut encore présents dans les données historiques. */
    private static final Map<String, String> LEGACY_STATUS_ALIASES = Map.of(
            "Soumis", STATUS_CREATION,
            "Valide", STATUS_FIRST_VALIDATION,
            "A completer", STATUS_CREATION);

    private static final Pattern AMOUNT_NOISE = Pattern.compile("[\\s\\u00A0\\u202F]|F?CFA|XAF|EUR", Pattern.CASE_INSENSITIVE);

    private final MissionGateway missionGateway;
    private final BudgetGateway budgetGateway;
    private final MissionWorkflowGateway workflowGateway;

    @Transactional(readOnly = true)
    public List<Mission> list() {
        return missionGateway.findAll();
    }

    public Mission create(MissionCreateCommand command, String actor) {
        String objetMission = Identifiers.normalize(command.objetMission());
        String destination = Identifiers.normalize(command.destination());
        String pays = Identifiers.normalize(command.pays());
        String dateDepart = Identifiers.normalize(command.dateDepart());
        String dateRetour = Identifiers.normalize(command.dateRetour());
        String montant = Identifiers.normalize(command.montantEstimatif());
        String budgetConcerne = Identifiers.normalize(command.budgetConcerne());
        String budgetItemId = Identifiers.normalize(command.budgetItemId());

        if (objetMission.isEmpty() || destination.isEmpty() || pays.isEmpty() || dateDepart.isEmpty()
                || dateRetour.isEmpty() || montant.isEmpty() || (budgetConcerne.isEmpty() && budgetItemId.isEmpty())) {
            throw BusinessException.badRequest(
                    "L'objet mission, la destination, le pays, les dates, le montant estimatif et le budget concerné sont obligatoires.");
        }

        BigDecimal amount = parseAmount(montant);
        String statut = Identifiers.normalize(command.statut());
        if (statut.isEmpty() || statut.equals("Soumis") || statut.equals(STATUS_CREATION)) {
            statut = STATUS_FIRST_VALIDATION;
        }

        BigDecimal consumed = BigDecimal.ZERO;
        Instant consumedAt = null;
        if (!budgetItemId.isEmpty()) {
            BudgetItem item = budgetGateway.findItem(budgetItemId)
                    .orElseThrow(() -> BusinessException.notFound("La ligne budgétaire sélectionnée est introuvable."));
            BigDecimal remaining = item.getAllocated().subtract(missionGateway.sumConsumedByBudgetItem(budgetItemId));
            if (amount.compareTo(remaining) > 0) {
                throw BusinessException.badRequest("Budget insuffisant sur cette ligne. Reste disponible : %s CFA."
                        .formatted(remaining.stripTrailingZeros().toPlainString()));
            }
            consumed = amount;
            consumedAt = Instant.now();
            budgetConcerne = item.getDirection() + " — " + item.getLabel();
        }

        String code = Identifiers.normalize(command.code());
        if (code.isEmpty()) {
            code = Identifiers.missionCode(missionGateway.findAllCodes());
        }
        if (missionGateway.existsByCodeIgnoreCase(code)) {
            throw BusinessException.conflict("Ce code mission existe déjà.");
        }

        Instant now = Instant.now();
        List<HistoryEntry> history = new ArrayList<>();
        history.add(HistoryEntry.builder().id(Identifiers.eventId()).at(now).actor(actor).action(statut)
                .commentaire("Formulaire de création soumis.").build());
        history.add(HistoryEntry.builder().id(Identifiers.eventId()).at(now).actor(actor).action(STATUS_CREATION)
                .build());

        Mission mission = Mission.builder()
                .code(code)
                .objetMission(objetMission)
                .destination(destination)
                .pays(pays)
                .dateDepart(dateDepart)
                .dateRetour(dateRetour)
                .montantEstimatif(amount)
                .budgetConcerne(budgetConcerne)
                .budgetItemId(budgetItemId.isEmpty() ? null : budgetItemId)
                .budgetConsumed(consumed)
                .budgetConsumedAt(consumedAt)
                .piecesJointes(new ArrayList<>(command.piecesJointes() == null ? List.of()
                        : command.piecesJointes().stream().map(String::strip).filter(name -> !name.isEmpty()).toList()))
                .statut(statut)
                .history(history)
                .build();
        return missionGateway.save(mission);
    }

    public Mission updateStatus(String code, MissionStatusCommand command, String actor) {
        Mission mission = missionGateway.findByCode(code)
                .orElseThrow(() -> BusinessException.notFound("Mission introuvable."));

        String currentStatus = LEGACY_STATUS_ALIASES.getOrDefault(mission.getStatut(), mission.getStatut());
        if (command.expectedStatus() != null) {
            String expected = LEGACY_STATUS_ALIASES.getOrDefault(command.expectedStatus(), command.expectedStatus());
            if (!expected.equals(currentStatus)) {
                throw BusinessException.conflict("Le statut de cette mission a changé. Actualisez la page.");
            }
        }

        String nextStatus = command.nextStatus();
        boolean allowed = workflowGateway.findTransitions().stream()
                .anyMatch(transition -> transition.from().equals(currentStatus) && transition.to().equals(nextStatus));
        if (!allowed) {
            throw BusinessException.badRequest("Transition non autorisée pour cette étape de mission.");
        }

        mission.setStatut(STATUS_RETURN_FIRST_VALIDATION.equals(nextStatus) ? STATUS_CREATION : nextStatus);
        List<HistoryEntry> history = new ArrayList<>();
        history.add(HistoryEntry.builder()
                .id(Identifiers.eventId())
                .at(Instant.now())
                .actor(actor)
                .email(actor)
                .action(nextStatus)
                .commentaire("Mission passée de %s à %s.".formatted(currentStatus, mission.getStatut()))
                .build());
        history.addAll(mission.getHistory());
        mission.setHistory(history);
        return missionGateway.save(mission);
    }

    static BigDecimal parseAmount(String value) {
        String normalized = AMOUNT_NOISE.matcher(value).replaceAll("").replace(',', '.');
        BigDecimal amount;
        try {
            amount = new BigDecimal(normalized);
        } catch (NumberFormatException exception) {
            throw BusinessException.badRequest("Le montant estimatif doit être numérique pour être imputé.");
        }
        if (amount.signum() <= 0) {
            throw BusinessException.badRequest("Le montant estimatif doit être supérieur à zéro.");
        }
        return amount;
    }
}
