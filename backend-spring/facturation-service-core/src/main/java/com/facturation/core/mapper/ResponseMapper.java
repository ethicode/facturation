package com.facturation.core.mapper;

import com.facturation.api.model.ApproDomainCatalogResponse;
import com.facturation.api.model.ApproStateResponse;
import com.facturation.api.model.AuthUserResponse;
import com.facturation.api.model.DashboardResponse;
import com.facturation.api.model.DeleteBudgetResponse;
import com.facturation.api.model.DirectionDefinition;
import com.facturation.api.model.FactureResponse;
import com.facturation.api.model.HistoryEntryResponse;
import com.facturation.api.model.MissionResponse;
import com.facturation.api.model.RoleDefinition;
import com.facturation.api.model.SupplyTicketResponse;
import com.facturation.api.model.WorkflowMetadataResponse;
import com.facturation.api.model.WorkflowStepAssignment;
import com.facturation.core.model.ApproDomain;
import com.facturation.core.model.ApproState;
import com.facturation.core.model.Dashboard;
import com.facturation.core.model.DeleteBudgetResult;
import com.facturation.core.model.Facture;
import com.facturation.core.model.HistoryEntry;
import com.facturation.core.model.Mission;
import com.facturation.core.model.Role;
import com.facturation.core.model.SupplyTicket;
import com.facturation.core.model.User;
import com.facturation.core.model.WorkflowAssignment;
import com.facturation.core.model.WorkflowMetadata;
import java.time.Instant;
import java.util.List;

/** Conversion du modèle métier vers les modèles exposés par l'API. */
public final class ResponseMapper {

    private ResponseMapper() {
    }

    public static FactureResponse toResponse(Facture facture) {
        return new FactureResponse(facture.getId(), facture.getFournisseur(), facture.getMontant(), facture.getDevise(),
                facture.getCentreCout(), facture.getDescription(), facture.getEcheance(), facture.getPriorite(),
                facture.getDirection(), facture.getResume(), facture.getNumeroFacture(), facture.getCompteCharge(),
                facture.getDateReception(), facture.getModeReception(), facture.getPiecesJointes(), facture.getStatut(),
                toHistory(facture.getHistory()));
    }

    public static List<FactureResponse> toFactureResponses(List<Facture> factures) {
        return factures.stream().map(ResponseMapper::toResponse).toList();
    }

    public static SupplyTicketResponse toResponse(SupplyTicket ticket) {
        return new SupplyTicketResponse(ticket.getId(), ticket.getDirection(), ticket.getObjet(), ticket.getMontant(),
                ticket.getDevise(), ticket.getTitreDemande(), ticket.getDomaine(), ticket.getSousDomaine(),
                ticket.getActionDemande(), ticket.getDateDebutSouhaitee(), ticket.getDateFinSouhaitee(),
                ticket.getDirectionDemandeur(), ticket.getBudgetPrevisionnel(), ticket.getPriorite(),
                ticket.getDescription(), ticket.getCommentaire(), ticket.getFichierNom(), ticket.getStatut(),
                ticket.getLinkedFactureId(), toHistory(ticket.getHistory()));
    }

    public static ApproStateResponse toResponse(ApproState state) {
        return new ApproStateResponse(
                state.budgets().stream()
                        .map(budget -> new ApproStateResponse.BudgetLine(budget.getDirection(), budget.getAllocated(),
                                budget.getEngaged(), budget.getAllocatedBy()))
                        .toList(),
                state.tickets().stream().map(ResponseMapper::toResponse).toList(),
                state.dirfinHistory().stream()
                        .map(entry -> new ApproStateResponse.DirfinHistory(entry.getId(), iso(entry.getAt()),
                                entry.getActor(), entry.getAction(), emptyIfNull(entry.getDetail())))
                        .toList(),
                state.budgetItems().stream()
                        .map(item -> new ApproStateResponse.BudgetItemLine(item.getId(), item.getDirection(),
                                item.getLabel(), item.getAllocated(), iso(item.getCreatedAt()),
                                emptyIfNull(item.getCreatedBy()), iso(item.getUpdatedAt()),
                                emptyIfNull(item.getUpdatedBy())))
                        .toList());
    }

    public static DeleteBudgetResponse toResponse(DeleteBudgetResult result) {
        return new DeleteBudgetResponse(toResponse(result.state()), emptyIfNull(result.error()));
    }

    public static MissionResponse toResponse(Mission mission) {
        String amount = mission.getMontantEstimatif() == null ? ""
                : mission.getMontantEstimatif().stripTrailingZeros().toPlainString() + " CFA";
        return new MissionResponse(mission.getCode(), mission.getObjetMission(), mission.getDestination(),
                mission.getPays(), mission.getDateDepart(), mission.getDateRetour(), amount,
                mission.getBudgetConcerne(), emptyIfNull(mission.getBudgetItemId()), mission.getBudgetConsumed(),
                iso(mission.getBudgetConsumedAt()), mission.getPiecesJointes(), mission.getStatut(),
                toHistory(mission.getHistory()));
    }

    public static List<MissionResponse> toMissionResponses(List<Mission> missions) {
        return missions.stream().map(ResponseMapper::toResponse).toList();
    }

    public static AuthUserResponse toResponse(User user) {
        return new AuthUserResponse(user.getId(), user.getUsername(), user.getFullName(), user.getFirstName(),
                user.getLastName(), user.getEmail(), user.getEmployeeId(), user.getDepartment(), user.getJobTitle(),
                user.getPhoneNumber(), user.getLocale(), user.getTimezone(), user.getRole(), user.getRoles(),
                user.isActive(), user.getStatus().code(), iso(user.getCreatedAt()), iso(user.getUpdatedAt()),
                user.getLastLoginAt() == null ? null : user.getLastLoginAt().toString());
    }

    public static List<RoleDefinition> toRoleDefinitions(List<Role> roles) {
        return roles.stream().map(role -> new RoleDefinition(role.code(), role.label())).toList();
    }

    public static List<DirectionDefinition> toDirectionDefinitions(List<String> names) {
        return names.stream().map(DirectionDefinition::new).toList();
    }

    public static ApproDomainCatalogResponse toCatalog(List<ApproDomain> domains) {
        return new ApproDomainCatalogResponse(domains.stream()
                .map(domain -> new ApproDomainCatalogResponse.Entry(domain.name(), domain.subdomains()))
                .toList());
    }

    public static WorkflowStepAssignment toResponse(WorkflowAssignment assignment) {
        return new WorkflowStepAssignment(assignment.step(), assignment.userIds(), assignment.workflowType());
    }

    public static List<WorkflowStepAssignment> toAssignments(List<WorkflowAssignment> assignments) {
        return assignments.stream().map(ResponseMapper::toResponse).toList();
    }

    public static WorkflowMetadataResponse toResponse(WorkflowMetadata metadata) {
        return new WorkflowMetadataResponse(metadata.factureStatuses(), metadata.userRoles(), metadata.roleLabels(),
                metadata.directions(), metadata.workflowSteps(), toAssignments(metadata.workflowAssignments()),
                metadata.approStatuses(), metadata.facturationStatuses());
    }

    public static DashboardResponse toResponse(Dashboard dashboard) {
        return new DashboardResponse(
                dashboard.kpiMetrics().stream()
                        .map(metric -> new DashboardResponse.Metric(metric.label(), metric.value(), metric.trend(),
                                metric.tone()))
                        .toList(),
                toMissionResponses(dashboard.missions()),
                dashboard.traceEvents().stream()
                        .map(event -> new DashboardResponse.TraceEvent(event.date(), event.action(), event.actor()))
                        .toList(),
                dashboard.budgetLines().stream()
                        .map(line -> new DashboardResponse.BudgetOverview(line.poste(), line.consomme(), line.plafond(),
                                line.tendance()))
                        .toList());
    }

    private static List<HistoryEntryResponse> toHistory(List<HistoryEntry> entries) {
        return entries.stream()
                .map(entry -> new HistoryEntryResponse(entry.getId(), iso(entry.getAt()), entry.getActor(),
                        entry.getEmail(), entry.getAction(), entry.getRole(), entry.getDetail(),
                        emptyIfNull(entry.getCommentaire()), entry.getPiecesJointes()))
                .toList();
    }

    /** Les dates absentes sont renvoyées en chaîne vide, comme dans le backend Python. */
    private static String iso(Instant value) {
        return value == null ? "" : value.toString();
    }

    private static String emptyIfNull(String value) {
        return value == null ? "" : value;
    }
}
