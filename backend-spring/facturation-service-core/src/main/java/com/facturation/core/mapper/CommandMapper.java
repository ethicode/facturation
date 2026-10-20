package com.facturation.core.mapper;

import com.facturation.api.model.BudgetUpsertRequest;
import com.facturation.api.model.FactureCreateRequest;
import com.facturation.api.model.FactureStatusRequest;
import com.facturation.api.model.MissionCreateRequest;
import com.facturation.api.model.MissionStatusRequest;
import com.facturation.api.model.SupplyTicketCreateRequest;
import com.facturation.api.model.UserCreateRequest;
import com.facturation.api.model.UserUpdateRequest;
import com.facturation.core.model.command.BudgetUpsertCommand;
import com.facturation.core.model.command.FactureCreateCommand;
import com.facturation.core.model.command.FactureStatusCommand;
import com.facturation.core.model.command.MissionCreateCommand;
import com.facturation.core.model.command.MissionStatusCommand;
import com.facturation.core.model.command.SupplyTicketCreateCommand;
import com.facturation.core.model.command.UserCommand;
import java.util.List;

/** Conversion des requêtes de l'API en commandes métier, avec les valeurs par défaut du backend Python. */
public final class CommandMapper {

    private CommandMapper() {
    }

    public static FactureCreateCommand toCommand(FactureCreateRequest request) {
        return new FactureCreateCommand(request.fournisseur(), request.montant(), or(request.devise(), "EUR"),
                request.centreCout(), request.description(), request.echeance(), request.priorite(),
                request.direction(), request.resume(), request.numeroFacture(), request.compteCharge(),
                request.dateReception(), request.modeReception(), list(request.piecesJointes()),
                or(request.actor(), "Systeme"), request.email(), or(request.role(), "utilisateur"));
    }

    public static FactureStatusCommand toCommand(FactureStatusRequest request) {
        return new FactureStatusCommand(request.nextStatus(), or(request.actor(), "Systeme Workflow"), request.email(),
                or(request.role(), "utilisateur"), request.actionLabel(), or(request.commentaire(), ""),
                list(request.piecesJointes()));
    }

    public static BudgetUpsertCommand toCommand(BudgetUpsertRequest request) {
        return new BudgetUpsertCommand(request.direction(), request.allocated(), request.engaged(),
                or(request.allocatedBy(), "DirFin"), or(request.actor(), "DirFin"));
    }

    public static SupplyTicketCreateCommand toCommand(SupplyTicketCreateRequest request) {
        return new SupplyTicketCreateCommand(request.direction(), request.objet(), request.montant(),
                or(request.devise(), "XAF"), request.titreDemande(), request.domaine(), request.sousDomaine(),
                request.actionDemande(), request.dateDebutSouhaitee(), request.dateFinSouhaitee(),
                request.directionDemandeur(), request.budgetPrevisionnel(), request.priorite(), request.description(),
                request.commentaire(), request.fichierNom(), or(request.actor(), "Demandeur"));
    }

    public static MissionCreateCommand toCommand(MissionCreateRequest request) {
        return new MissionCreateCommand(request.code(), request.objetMission(), request.destination(), request.pays(),
                request.dateDepart(), request.dateRetour(), request.montantEstimatif(), request.budgetConcerne(),
                request.budgetItemId(), list(request.piecesJointes()), or(request.statut(), "Soumis"));
    }

    public static MissionStatusCommand toCommand(MissionStatusRequest request) {
        return new MissionStatusCommand(request.nextStatus(), request.expectedStatus());
    }

    public static UserCommand toCommand(UserCreateRequest request) {
        return new UserCommand(request.username(), request.password(), request.fullName(), request.firstName(),
                request.lastName(), request.employeeId(), request.department(), request.jobTitle(),
                request.phoneNumber(), request.managerId(), request.locale(), request.timezone(), request.role(),
                list(request.roles()), request.email(), true, null);
    }

    public static UserCommand toCommand(UserUpdateRequest request) {
        return new UserCommand(null, null, request.fullName(), request.firstName(), request.lastName(),
                request.employeeId(), request.department(), request.jobTitle(), request.phoneNumber(),
                request.managerId(), request.locale(), request.timezone(), request.role(), list(request.roles()),
                request.email(), request.active() == null ? Boolean.TRUE : request.active(), request.status());
    }

    private static String or(String value, String fallback) {
        return value == null ? fallback : value;
    }

    private static <T> List<T> list(List<T> value) {
        return value == null ? List.of() : value;
    }
}
