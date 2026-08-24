package com.facturation.gateways.persistence;

import com.facturation.core.gateway.AppStateGateway;
import com.facturation.core.model.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.util.*;

@Component
public class SqliteAppStateGateway implements AppStateGateway {
    private static final String STATE_ID = "state";

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public SqliteAppStateGateway(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public AppState read() {
        try {
            if (isNormalizedEmpty()) {
                AppState legacyState = readLegacyAppState();
                if (legacyState != null) {
                    writeNormalized(legacyState);
                }
            }

            AppState state = readNormalized();
            if (state.users.isEmpty() && state.roles.isEmpty()) {
                AppState seed = AppState.seed();
                write(seed);
                return seed;
            }
            return state;
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot read app state", ex);
        }
    }

    @Override
    @Transactional
    public void write(AppState state) {
        try {
            writeNormalized(state);
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot write app state", ex);
        }
    }

    private boolean isNormalizedEmpty() {
        int roles = count("roles");
        int users = count("users");
        int factures = count("factures");
        int budgets = count("budgets");
        int tickets = count("tickets");
        return roles == 0 && users == 0 && factures == 0 && budgets == 0 && tickets == 0;
    }

    private int count(String table) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
        return count == null ? 0 : count;
    }

    private AppState readLegacyAppState() {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'app_state'",
                    Integer.class
            );
            if (tableExists == null || tableExists == 0) {
                return null;
            }

            String payload = jdbcTemplate.query(
                    "SELECT payload FROM app_state WHERE id = ?",
                    rs -> rs.next() ? rs.getString("payload") : null,
                    STATE_ID
            );
            if (payload == null || payload.isBlank()) {
                return null;
            }
            return objectMapper.readValue(payload, AppState.class);
        } catch (Exception ex) {
            return null;
        }
    }

    private AppState readNormalized() {
        AppState state = new AppState();
        state.roles = readRoles();
        state.users = readUsers();
        state.directions = readDirections();
        state.workflowAssignments = readWorkflowAssignments();
        state.factureStatuses = readFactureStatuses();
        state.factures = readFactures();
        state.appro = readApproState();
        state.kpiMetrics = readMapStringList("dashboard_kpi");
        state.missions = readMapStringList("dashboard_mission");
        state.traceEvents = readMapStringList("dashboard_trace_event");
        state.budgetLines = readMapObjectList("dashboard_budget_line");
        return state;
    }

    private void writeNormalized(AppState state) {
        clearAllNormalizedTables();

        for (int i = 0; i < state.roles.size(); i++) {
            RoleDefinition role = state.roles.get(i);
            jdbcTemplate.update(
                    "INSERT INTO roles(code, label, position) VALUES (?, ?, ?)",
                    role.code,
                    role.label,
                    i
            );
        }

        for (UserRecord user : state.users) {
            jdbcTemplate.update(
                    "INSERT INTO users(id, username, full_name, email, role, password_hash, is_active, status, created_at, updated_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    user.id,
                    user.username,
                    user.fullName,
                    user.email,
                    user.role,
                    user.passwordHash,
                    user.isActive ? 1 : 0,
                    user.status,
                    user.createdAt,
                    user.updatedAt,
                    user.lastLoginAt
            );

            List<String> roles = user.roles == null || user.roles.isEmpty() ? List.of(user.role) : user.roles;
            for (int i = 0; i < roles.size(); i++) {
                jdbcTemplate.update(
                        "INSERT INTO user_roles(user_id, role_code, position) VALUES (?, ?, ?)",
                        user.id,
                        roles.get(i),
                        i
                );
            }
        }

        for (int i = 0; i < state.directions.size(); i++) {
            jdbcTemplate.update("INSERT INTO directions(name, position) VALUES (?, ?)", state.directions.get(i), i);
        }

        for (WorkflowStepAssignment assignment : state.workflowAssignments) {
            List<String> users = assignment.userIds == null ? List.of() : assignment.userIds;
            for (int i = 0; i < users.size(); i++) {
                jdbcTemplate.update(
                        "INSERT INTO workflow_assignments(step, workflow_type, user_id, position) VALUES (?, ?, ?, ?)",
                        assignment.step,
                        assignment.workflowType,
                        users.get(i),
                        i
                );
            }
        }

        for (int i = 0; i < state.factureStatuses.size(); i++) {
            jdbcTemplate.update("INSERT INTO facture_statuses(status, position) VALUES (?, ?)", state.factureStatuses.get(i), i);
        }

        for (int i = 0; i < state.factures.size(); i++) {
            FactureRecord facture = state.factures.get(i);
            jdbcTemplate.update(
                    "INSERT INTO factures(id, fournisseur, montant, devise, centre_cout, description, echeance, priorite, direction, resume, numero_facture, compte_charge, date_reception, mode_reception, statut, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    facture.id,
                    facture.fournisseur,
                    facture.montant,
                    facture.devise,
                    facture.centreCout,
                    facture.description,
                    facture.echeance,
                    facture.priorite,
                    facture.direction,
                    facture.resume,
                    facture.numeroFacture,
                    facture.compteCharge,
                    facture.dateReception,
                    facture.modeReception,
                    facture.statut,
                    i
            );

            for (int a = 0; a < facture.piecesJointes.size(); a++) {
                jdbcTemplate.update(
                        "INSERT INTO facture_attachments(facture_id, position, value) VALUES (?, ?, ?)",
                        facture.id,
                        a,
                        facture.piecesJointes.get(a)
                );
            }

            for (int h = 0; h < facture.history.size(); h++) {
                HistoryEntry historyEntry = facture.history.get(h);
                final int historyPosition = h;
                KeyHolder keyHolder = new GeneratedKeyHolder();
                jdbcTemplate.update(connection -> {
                    PreparedStatement ps = connection.prepareStatement(
                            "INSERT INTO facture_history(facture_id, position, at, actor, email, action, role, detail, commentaire) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            new String[]{"id"}
                    );
                    ps.setString(1, facture.id);
                    ps.setInt(2, historyPosition);
                    ps.setString(3, historyEntry.at);
                    ps.setString(4, historyEntry.actor);
                    ps.setString(5, historyEntry.email);
                    ps.setString(6, historyEntry.action);
                    ps.setString(7, historyEntry.role);
                    ps.setString(8, historyEntry.detail);
                    ps.setString(9, historyEntry.commentaire);
                    return ps;
                }, keyHolder);

                Number generatedId = keyHolder.getKey();
                if (generatedId == null) {
                    continue;
                }

                List<String> attachments = historyEntry.piecesJointes == null ? List.of() : historyEntry.piecesJointes;
                for (int a = 0; a < attachments.size(); a++) {
                    jdbcTemplate.update(
                            "INSERT INTO facture_history_attachments(history_id, position, value) VALUES (?, ?, ?)",
                            generatedId.longValue(),
                            a,
                            attachments.get(a)
                    );
                }
            }
        }

        List<BudgetLine> budgets = state.appro == null || state.appro.budgets == null ? List.of() : state.appro.budgets;
        for (int i = 0; i < budgets.size(); i++) {
            BudgetLine budget = budgets.get(i);
            jdbcTemplate.update(
                    "INSERT INTO budgets(direction, allocated, engaged, allocated_by, position) VALUES (?, ?, ?, ?, ?)",
                    budget.direction,
                    budget.allocated,
                    budget.engaged,
                    budget.allocatedBy,
                    i
            );
        }

        List<SupplyTicket> tickets = state.appro == null || state.appro.tickets == null ? List.of() : state.appro.tickets;
        for (int i = 0; i < tickets.size(); i++) {
            SupplyTicket ticket = tickets.get(i);
            jdbcTemplate.update(
                    "INSERT INTO tickets(id, direction, objet, montant, devise, titre_demande, domaine, sous_domaine, action_demande, date_debut_souhaitee, date_fin_souhaitee, direction_demandeur, budget_previsionnel, priorite, description, commentaire, fichier_nom, statut, linked_facture_id, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    ticket.id,
                    ticket.direction,
                    ticket.objet,
                    ticket.montant,
                    ticket.devise,
                    ticket.titre_demande,
                    ticket.domaine,
                    ticket.sous_domaine,
                    ticket.action_demande,
                    ticket.date_debut_souhaitee,
                    ticket.date_fin_souhaitee,
                    ticket.direction_demandeur,
                    ticket.budget_previsionnel,
                    ticket.priorite,
                    ticket.description,
                    ticket.commentaire,
                    ticket.fichier_nom,
                    ticket.statut,
                    ticket.linkedFactureId,
                    i
            );

            for (int h = 0; h < ticket.history.size(); h++) {
                HistoryEntry historyEntry = ticket.history.get(h);
                final int historyPosition = h;
                KeyHolder keyHolder = new GeneratedKeyHolder();
                jdbcTemplate.update(connection -> {
                    PreparedStatement ps = connection.prepareStatement(
                            "INSERT INTO ticket_history(ticket_id, position, at, actor, email, action, role, detail, commentaire) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            new String[]{"id"}
                    );
                    ps.setString(1, ticket.id);
                    ps.setInt(2, historyPosition);
                    ps.setString(3, historyEntry.at);
                    ps.setString(4, historyEntry.actor);
                    ps.setString(5, historyEntry.email);
                    ps.setString(6, historyEntry.action);
                    ps.setString(7, historyEntry.role);
                    ps.setString(8, historyEntry.detail);
                    ps.setString(9, historyEntry.commentaire);
                    return ps;
                }, keyHolder);

                Number generatedId = keyHolder.getKey();
                if (generatedId == null) {
                    continue;
                }

                List<String> attachments = historyEntry.piecesJointes == null ? List.of() : historyEntry.piecesJointes;
                for (int a = 0; a < attachments.size(); a++) {
                    jdbcTemplate.update(
                            "INSERT INTO ticket_history_attachments(history_id, position, value) VALUES (?, ?, ?)",
                            generatedId.longValue(),
                            a,
                            attachments.get(a)
                    );
                }
            }
        }

        List<Map<String, String>> dirfinHistory = state.appro == null || state.appro.dirfinHistory == null ? List.of() : state.appro.dirfinHistory;
        for (int i = 0; i < dirfinHistory.size(); i++) {
            jdbcTemplate.update("INSERT INTO dirfin_history(position, payload) VALUES (?, ?)", i, writeJson(dirfinHistory.get(i)));
        }

        writePayloadRows("dashboard_kpi", state.kpiMetrics);
        writePayloadRows("dashboard_mission", state.missions);
        writePayloadRows("dashboard_trace_event", state.traceEvents);
        writePayloadRows("dashboard_budget_line", state.budgetLines);
    }

    private void writePayloadRows(String table, List<?> payloads) {
        List<?> safePayloads = payloads == null ? List.of() : payloads;
        for (int i = 0; i < safePayloads.size(); i++) {
            jdbcTemplate.update("INSERT INTO " + table + "(position, payload) VALUES (?, ?)", i, writeJson(safePayloads.get(i)));
        }
    }

    private List<RoleDefinition> readRoles() {
        return jdbcTemplate.query("SELECT code, label FROM roles ORDER BY position ASC",
                (rs, rowNum) -> {
                    RoleDefinition role = new RoleDefinition();
                    role.code = rs.getString("code");
                    role.label = rs.getString("label");
                    return role;
                });
    }

    private List<UserRecord> readUsers() {
        Map<String, List<String>> userRoles = new LinkedHashMap<>();
        jdbcTemplate.query("SELECT user_id, role_code FROM user_roles ORDER BY position ASC", rs -> {
            userRoles.computeIfAbsent(rs.getString("user_id"), ignored -> new ArrayList<>())
                    .add(rs.getString("role_code"));
        });

        return jdbcTemplate.query(
                "SELECT id, username, full_name, email, role, password_hash, is_active, status, created_at, updated_at, last_login_at FROM users ORDER BY username ASC",
                (rs, rowNum) -> {
                    UserRecord user = new UserRecord();
                    user.id = rs.getString("id");
                    user.username = rs.getString("username");
                    user.fullName = rs.getString("full_name");
                    user.email = rs.getString("email");
                    user.role = rs.getString("role");
                    user.passwordHash = rs.getString("password_hash");
                    user.isActive = rs.getInt("is_active") == 1;
                    user.status = rs.getString("status");
                    user.createdAt = rs.getString("created_at");
                    user.updatedAt = rs.getString("updated_at");
                    user.lastLoginAt = rs.getString("last_login_at");
                    user.roles = userRoles.getOrDefault(user.id, List.of(user.role));
                    return user;
                }
        );
    }

    private List<String> readDirections() {
        return jdbcTemplate.query("SELECT name FROM directions ORDER BY position ASC", (rs, rowNum) -> rs.getString("name"));
    }

    private List<WorkflowStepAssignment> readWorkflowAssignments() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT step, workflow_type, user_id, position FROM workflow_assignments ORDER BY workflow_type ASC, step ASC, position ASC"
        );

        Map<String, WorkflowStepAssignment> grouped = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            String step = String.valueOf(row.get("step"));
            String workflowType = String.valueOf(row.get("workflow_type"));
            String key = workflowType + "::" + step;
            WorkflowStepAssignment assignment = grouped.computeIfAbsent(key, ignored -> {
                WorkflowStepAssignment item = new WorkflowStepAssignment();
                item.step = step;
                item.workflowType = workflowType;
                item.userIds = new ArrayList<>();
                return item;
            });
            assignment.userIds.add(String.valueOf(row.get("user_id")));
        }

        return new ArrayList<>(grouped.values());
    }

    private List<String> readFactureStatuses() {
        return jdbcTemplate.query("SELECT status FROM facture_statuses ORDER BY position ASC", (rs, rowNum) -> rs.getString("status"));
    }

    private List<FactureRecord> readFactures() {
        List<FactureRecord> factures = jdbcTemplate.query(
                "SELECT id, fournisseur, montant, devise, centre_cout, description, echeance, priorite, direction, resume, numero_facture, compte_charge, date_reception, mode_reception, statut FROM factures ORDER BY position ASC",
                (rs, rowNum) -> {
                    FactureRecord facture = new FactureRecord();
                    facture.id = rs.getString("id");
                    facture.fournisseur = rs.getString("fournisseur");
                    facture.montant = rs.getDouble("montant");
                    facture.devise = rs.getString("devise");
                    facture.centreCout = rs.getString("centre_cout");
                    facture.description = rs.getString("description");
                    facture.echeance = rs.getString("echeance");
                    facture.priorite = rs.getString("priorite");
                    facture.direction = rs.getString("direction");
                    facture.resume = rs.getString("resume");
                    facture.numeroFacture = rs.getString("numero_facture");
                    facture.compteCharge = rs.getString("compte_charge");
                    facture.dateReception = rs.getString("date_reception");
                    facture.modeReception = rs.getString("mode_reception");
                    facture.statut = rs.getString("statut");
                    return facture;
                }
        );

        for (FactureRecord facture : factures) {
            facture.piecesJointes = jdbcTemplate.query(
                    "SELECT value FROM facture_attachments WHERE facture_id = ? ORDER BY position ASC",
                    (rs, rowNum) -> rs.getString("value"),
                    facture.id
            );

            List<Map<String, Object>> historyRows = jdbcTemplate.queryForList(
                    "SELECT id, at, actor, email, action, role, detail, commentaire FROM facture_history WHERE facture_id = ? ORDER BY position ASC",
                    facture.id
            );

            facture.history = new ArrayList<>();
            for (Map<String, Object> row : historyRows) {
                HistoryEntry entry = new HistoryEntry();
                long historyId = ((Number) row.get("id")).longValue();
                entry.at = toStringValue(row.get("at"));
                entry.actor = toStringValue(row.get("actor"));
                entry.email = toStringValue(row.get("email"));
                entry.action = toStringValue(row.get("action"));
                entry.role = toStringValue(row.get("role"));
                entry.detail = toStringValue(row.get("detail"));
                entry.commentaire = toStringValue(row.get("commentaire"));
                entry.piecesJointes = jdbcTemplate.query(
                        "SELECT value FROM facture_history_attachments WHERE history_id = ? ORDER BY position ASC",
                        (rs, rowNum) -> rs.getString("value"),
                        historyId
                );
                facture.history.add(entry);
            }
        }
        return factures;
    }

    private ApproState readApproState() {
        ApproState approState = new ApproState();

        approState.budgets = jdbcTemplate.query(
                "SELECT direction, allocated, engaged, allocated_by FROM budgets ORDER BY position ASC",
                (rs, rowNum) -> {
                    BudgetLine budget = new BudgetLine();
                    budget.direction = rs.getString("direction");
                    budget.allocated = rs.getDouble("allocated");
                    budget.engaged = rs.getDouble("engaged");
                    budget.allocatedBy = rs.getString("allocated_by");
                    return budget;
                }
        );

        approState.tickets = jdbcTemplate.query(
                "SELECT id, direction, objet, montant, devise, titre_demande, domaine, sous_domaine, action_demande, date_debut_souhaitee, date_fin_souhaitee, direction_demandeur, budget_previsionnel, priorite, description, commentaire, fichier_nom, statut, linked_facture_id FROM tickets ORDER BY position ASC",
                (rs, rowNum) -> {
                    SupplyTicket ticket = new SupplyTicket();
                    ticket.id = rs.getString("id");
                    ticket.direction = rs.getString("direction");
                    ticket.objet = rs.getString("objet");
                    ticket.montant = rs.getDouble("montant");
                    ticket.devise = rs.getString("devise");
                    ticket.titre_demande = rs.getString("titre_demande");
                    ticket.domaine = rs.getString("domaine");
                    ticket.sous_domaine = rs.getString("sous_domaine");
                    ticket.action_demande = rs.getString("action_demande");
                    ticket.date_debut_souhaitee = rs.getString("date_debut_souhaitee");
                    ticket.date_fin_souhaitee = rs.getString("date_fin_souhaitee");
                    ticket.direction_demandeur = rs.getString("direction_demandeur");
                    ticket.budget_previsionnel = rs.getDouble("budget_previsionnel");
                    ticket.priorite = rs.getString("priorite");
                    ticket.description = rs.getString("description");
                    ticket.commentaire = rs.getString("commentaire");
                    ticket.fichier_nom = rs.getString("fichier_nom");
                    ticket.statut = rs.getString("statut");
                    ticket.linkedFactureId = rs.getString("linked_facture_id");
                    return ticket;
                }
        );

        for (SupplyTicket ticket : approState.tickets) {
            List<Map<String, Object>> historyRows = jdbcTemplate.queryForList(
                    "SELECT id, at, actor, email, action, role, detail, commentaire FROM ticket_history WHERE ticket_id = ? ORDER BY position ASC",
                    ticket.id
            );

            ticket.history = new ArrayList<>();
            for (Map<String, Object> row : historyRows) {
                HistoryEntry entry = new HistoryEntry();
                long historyId = ((Number) row.get("id")).longValue();
                entry.at = toStringValue(row.get("at"));
                entry.actor = toStringValue(row.get("actor"));
                entry.email = toStringValue(row.get("email"));
                entry.action = toStringValue(row.get("action"));
                entry.role = toStringValue(row.get("role"));
                entry.detail = toStringValue(row.get("detail"));
                entry.commentaire = toStringValue(row.get("commentaire"));
                entry.piecesJointes = jdbcTemplate.query(
                        "SELECT value FROM ticket_history_attachments WHERE history_id = ? ORDER BY position ASC",
                        (rs, rowNum) -> rs.getString("value"),
                        historyId
                );
                ticket.history.add(entry);
            }
        }

        approState.dirfinHistory = readDirfinHistory();
        return approState;
    }

    private List<Map<String, String>> readDirfinHistory() {
        List<Map<String, String>> history = new ArrayList<>();
        jdbcTemplate.query("SELECT payload FROM dirfin_history ORDER BY position ASC", rs -> {
            try {
                Map<String, String> value = objectMapper.readValue(rs.getString("payload"), new TypeReference<>() {
                });
                history.add(value);
            } catch (Exception ex) {
                throw new IllegalStateException("Cannot decode dirfin_history payload", ex);
            }
        });
        return history;
    }

    private List<Map<String, String>> readMapStringList(String table) {
        List<Map<String, String>> items = new ArrayList<>();
        jdbcTemplate.query("SELECT payload FROM " + table + " ORDER BY position ASC", rs -> {
            try {
                Map<String, String> value = objectMapper.readValue(rs.getString("payload"), new TypeReference<>() {
                });
                items.add(value);
            } catch (Exception ex) {
                throw new IllegalStateException("Cannot decode payload from " + table, ex);
            }
        });
        return items;
    }

    private List<Map<String, Object>> readMapObjectList(String table) {
        List<Map<String, Object>> items = new ArrayList<>();
        jdbcTemplate.query("SELECT payload FROM " + table + " ORDER BY position ASC", rs -> {
            try {
                Map<String, Object> value = objectMapper.readValue(rs.getString("payload"), new TypeReference<>() {
                });
                items.add(value);
            } catch (Exception ex) {
                throw new IllegalStateException("Cannot decode payload from " + table, ex);
            }
        });
        return items;
    }

    private void clearAllNormalizedTables() {
        List<String> tables = List.of(
                "facture_history_attachments",
                "facture_history",
                "facture_attachments",
                "factures",
                "ticket_history_attachments",
                "ticket_history",
                "tickets",
                "budgets",
                "workflow_assignments",
                "user_roles",
                "users",
                "roles",
                "directions",
                "facture_statuses",
                "dirfin_history",
                "dashboard_kpi",
                "dashboard_mission",
                "dashboard_trace_event",
                "dashboard_budget_line"
        );

        for (String table : tables) {
            jdbcTemplate.update("DELETE FROM " + table);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot serialize JSON payload", ex);
        }
    }

    private String toStringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
