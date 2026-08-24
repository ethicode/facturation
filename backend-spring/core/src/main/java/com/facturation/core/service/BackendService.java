package com.facturation.core.service;

import com.facturation.core.gateway.AppStateGateway;
import com.facturation.core.model.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

public class BackendService {
    private final AppStateGateway gateway;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public BackendService(AppStateGateway gateway, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.gateway = gateway;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        ensureSeed();
    }

    private synchronized void ensureSeed() {
        AppState state = gateway.read();
        if (state.users.isEmpty()) {
            state = AppState.seed();
        }
        UserRecord admin = state.users.stream().filter(u -> "admin".equalsIgnoreCase(u.username)).findFirst().orElse(null);
        if (admin != null && (admin.passwordHash == null || admin.passwordHash.isBlank())) {
            admin.passwordHash = passwordEncoder.encode("admin123");
            admin.createdAt = now();
            admin.updatedAt = now();
        }
        gateway.write(state);
    }

    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    public synchronized Map<String, Object> login(String username, String password) {
        AppState state = gateway.read();
        UserRecord user = state.users.stream()
                .filter(u -> u.username != null && u.username.equalsIgnoreCase(username))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable"));

        if (!passwordEncoder.matches(password, user.passwordHash)) {
            throw new IllegalArgumentException("Identifiants invalides");
        }

        user.lastLoginAt = now();
        user.updatedAt = now();
        gateway.write(state);

        String token = tokenService.createToken(user.id, user.username, user.role, 480);
        return Map.of(
                "access_token", token,
                "token_type", "bearer",
                "user", toUserSummary(user)
        );
    }

    public synchronized Map<String, Object> currentUser(String token) {
        AppState state = gateway.read();
        String subject = String.valueOf(tokenService.decode(token).get("sub"));
        UserRecord user = state.users.stream().filter(u -> Objects.equals(u.id, subject)).findFirst()
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable"));
        return toUserSummary(user);
    }

    public synchronized Map<String, Object> dashboard() {
        AppState state = gateway.read();
        return Map.of(
                "kpi_metrics", state.kpiMetrics,
                "missions", state.missions,
                "trace_events", state.traceEvents,
                "budget_lines", state.budgetLines
        );
    }

    public synchronized Map<String, Object> workflowMeta() {
        AppState state = gateway.read();
        Map<String, String> roleLabels = state.roles.stream()
                .collect(Collectors.toMap(r -> r.code, r -> r.label, (a, b) -> b, LinkedHashMap::new));

        return Map.of(
                "facture_statuses", state.factureStatuses,
                "user_roles", state.roles.stream().map(r -> r.code).toList(),
                "role_labels", roleLabels,
                "directions", state.directions
        );
    }

    public synchronized List<Map<String, Object>> workflowTasks() {
        AppState state = gateway.read();
        List<Map<String, Object>> tasks = new ArrayList<>();
        for (FactureRecord facture : state.factures) {
            Map<String, Object> task = new LinkedHashMap<>();
            task.put("id", "facturation:" + facture.id);
            task.put("workflow_type", "facturation");
            task.put("reference", facture.id);
            task.put("step", facture.statut);
            task.put("resolved_by", facture.history.isEmpty() ? "" : facture.history.get(0).actor);
            task.put("resolved_at", facture.history.isEmpty() ? "" : facture.history.get(0).at);
            task.put("assigned_users", List.of());
            task.put("pieces_jointes", facture.piecesJointes);
            task.put("history", facture.history);
            tasks.add(task);
        }
        for (SupplyTicket ticket : state.appro.tickets) {
            Map<String, Object> task = new LinkedHashMap<>();
            task.put("id", "approvisionnement:" + ticket.id);
            task.put("workflow_type", "approvisionnement");
            task.put("reference", ticket.id);
            task.put("step", ticket.statut);
            task.put("resolved_by", ticket.history.isEmpty() ? "" : ticket.history.get(0).actor);
            task.put("resolved_at", ticket.history.isEmpty() ? "" : ticket.history.get(0).at);
            task.put("assigned_users", List.of());
            task.put("pieces_jointes", ticket.fichier_nom == null || ticket.fichier_nom.isBlank() ? List.of() : List.of(ticket.fichier_nom));
            task.put("history", ticket.history);
            tasks.add(task);
        }
        return tasks;
    }

    public synchronized List<FactureRecord> listFactures() {
        return gateway.read().factures;
    }

    public synchronized FactureRecord getFacture(String id) {
        return gateway.read().factures.stream().filter(f -> Objects.equals(f.id, id)).findFirst()
                .orElseThrow(() -> new NoSuchElementException("Facture introuvable"));
    }

    public synchronized FactureRecord createFacture(Map<String, Object> payload) {
        AppState state = gateway.read();
        FactureRecord facture = new FactureRecord();
        facture.id = "FAC-" + System.currentTimeMillis();
        facture.fournisseur = str(payload.get("fournisseur"));
        facture.montant = dbl(payload.get("montant"));
        facture.devise = strOrDefault(payload.get("devise"), "EUR");
        facture.centreCout = str(payload.get("centreCout"));
        facture.description = str(payload.get("description"));
        facture.echeance = str(payload.get("echeance"));
        facture.priorite = strOrDefault(payload.get("priorite"), "");
        facture.direction = strOrDefault(payload.get("direction"), "");
        facture.resume = strOrDefault(payload.get("resume"), "");
        facture.numeroFacture = strOrDefault(payload.get("numeroFacture"), "");
        facture.compteCharge = strOrDefault(payload.get("compteCharge"), facture.centreCout);
        facture.dateReception = strOrDefault(payload.get("dateReception"), facture.echeance);
        facture.modeReception = strOrDefault(payload.get("modeReception"), "");
        facture.statut = "Vérification métier";

        HistoryEntry entry = new HistoryEntry();
        entry.at = now();
        entry.actor = strOrDefault(payload.get("actor"), "Systeme");
        entry.role = strOrDefault(payload.get("role"), "utilisateur");
        entry.action = "Demande soumise et étape de saisie validée automatiquement";
        facture.history.add(entry);

        state.factures.add(0, facture);
        gateway.write(state);
        return facture;
    }

    public synchronized List<FactureRecord> deleteFacture(String id) {
        AppState state = gateway.read();
        state.factures.removeIf(f -> Objects.equals(f.id, id));
        gateway.write(state);
        return state.factures;
    }

    public synchronized FactureRecord updateFactureStatus(String id, Map<String, Object> payload) {
        AppState state = gateway.read();
        FactureRecord facture = state.factures.stream().filter(f -> Objects.equals(f.id, id)).findFirst()
                .orElseThrow(() -> new NoSuchElementException("Facture introuvable"));

        String next = str(payload.get("next_status"));
        facture.statut = "Paiement effectué".equals(next) ? "Clôturée" : next;

        HistoryEntry entry = new HistoryEntry();
        entry.at = now();
        entry.actor = strOrDefault(payload.get("actor"), "Systeme Workflow");
        entry.email = strOrDefault(payload.get("email"), "");
        entry.role = strOrDefault(payload.get("role"), "utilisateur");
        entry.action = strOrDefault(payload.get("action_label"), "Statut passe a " + next);
        entry.commentaire = strOrDefault(payload.get("commentaire"), "");
        facture.history.add(0, entry);

        gateway.write(state);
        return facture;
    }

    public synchronized ApproState getApproState() {
        return gateway.read().appro;
    }

    public synchronized ApproState saveBudget(Map<String, Object> payload) {
        AppState state = gateway.read();
        String direction = str(payload.get("direction"));
        BudgetLine budget = state.appro.budgets.stream().filter(b -> Objects.equals(b.direction, direction)).findFirst().orElse(null);
        if (budget == null) {
            budget = new BudgetLine();
            budget.direction = direction;
            state.appro.budgets.add(budget);
        }
        budget.allocated = dbl(payload.get("allocated"));
        budget.engaged = dbl(payload.get("engaged"));
        budget.allocatedBy = strOrDefault(payload.get("allocatedBy"), "DirFin");
        gateway.write(state);
        return state.appro;
    }

    public synchronized Map<String, Object> deleteBudget(String direction) {
        AppState state = gateway.read();
        state.appro.budgets.removeIf(b -> Objects.equals(b.direction, direction));
        gateway.write(state);
        return Map.of("state", state.appro, "error", "");
    }

    public synchronized SupplyTicket createTicket(Map<String, Object> payload) {
        AppState state = gateway.read();
        SupplyTicket ticket = new SupplyTicket();
        ticket.id = "APPRO-" + System.currentTimeMillis();
        ticket.direction = strOrDefault(payload.get("direction"), "");
        ticket.objet = strOrDefault(payload.get("objet"), "");
        ticket.montant = dbl(payload.get("montant"));
        ticket.devise = strOrDefault(payload.get("devise"), "XAF");
        ticket.titre_demande = strOrDefault(payload.get("titre_demande"), "");
        ticket.description = strOrDefault(payload.get("description"), "");
        ticket.commentaire = strOrDefault(payload.get("commentaire"), "");
        ticket.statut = "Initialisation";

        HistoryEntry entry = new HistoryEntry();
        entry.at = now();
        entry.actor = strOrDefault(payload.get("actor"), "Demandeur");
        entry.action = "Ticket créé";
        ticket.history.add(entry);

        state.appro.tickets.add(0, ticket);
        gateway.write(state);
        return ticket;
    }

    public synchronized ApproState deleteTicket(String ticketId) {
        AppState state = gateway.read();
        state.appro.tickets.removeIf(t -> Objects.equals(t.id, ticketId));
        gateway.write(state);
        return state.appro;
    }

    public synchronized ApproState verifyTicket(String ticketId, String actor) {
        AppState state = gateway.read();
        SupplyTicket ticket = state.appro.tickets.stream().filter(t -> Objects.equals(t.id, ticketId)).findFirst()
                .orElseThrow(() -> new NoSuchElementException("Ticket introuvable"));
        ticket.statut = "En cours";
        HistoryEntry entry = new HistoryEntry();
        entry.at = now();
        entry.actor = actor;
        entry.action = "Budget vérifié";
        ticket.history.add(0, entry);
        gateway.write(state);
        return state.appro;
    }

    public synchronized ApproState closeTicket(String ticketId, String actor) {
        AppState state = gateway.read();
        SupplyTicket ticket = state.appro.tickets.stream().filter(t -> Objects.equals(t.id, ticketId)).findFirst()
                .orElseThrow(() -> new NoSuchElementException("Ticket introuvable"));
        ticket.statut = "Transférée en facturation";
        HistoryEntry entry = new HistoryEntry();
        entry.at = now();
        entry.actor = actor;
        entry.action = "Ticket clos";
        ticket.history.add(0, entry);
        gateway.write(state);
        return state.appro;
    }

    public synchronized List<DirectionDefinition> listDirections() {
        AppState state = gateway.read();
        return state.directions.stream().map(name -> {
            DirectionDefinition d = new DirectionDefinition();
            d.name = name;
            return d;
        }).toList();
    }

    public synchronized List<DirectionDefinition> createDirection(String name) {
        AppState state = gateway.read();
        if (state.directions.stream().noneMatch(d -> d.equalsIgnoreCase(name))) {
            state.directions.add(name);
        }
        gateway.write(state);
        return listDirections();
    }

    public synchronized List<DirectionDefinition> updateDirection(String currentName, String newName) {
        AppState state = gateway.read();
        for (int i = 0; i < state.directions.size(); i++) {
            if (state.directions.get(i).equalsIgnoreCase(currentName)) {
                state.directions.set(i, newName);
                break;
            }
        }
        gateway.write(state);
        return listDirections();
    }

    public synchronized List<DirectionDefinition> deleteDirection(String name) {
        AppState state = gateway.read();
        state.directions.removeIf(d -> d.equalsIgnoreCase(name));
        gateway.write(state);
        return listDirections();
    }

    public synchronized List<RoleDefinition> listRoles() {
        return gateway.read().roles;
    }

    public synchronized List<RoleDefinition> createRole(RoleDefinition role) {
        AppState state = gateway.read();
        if (state.roles.stream().noneMatch(r -> r.code.equalsIgnoreCase(role.code))) {
            state.roles.add(role);
        }
        gateway.write(state);
        return state.roles;
    }

    public synchronized List<RoleDefinition> updateRole(String code, String label) {
        AppState state = gateway.read();
        for (RoleDefinition role : state.roles) {
            if (role.code.equalsIgnoreCase(code)) {
                role.label = label;
            }
        }
        gateway.write(state);
        return state.roles;
    }

    public synchronized List<RoleDefinition> deleteRole(String code) {
        AppState state = gateway.read();
        state.roles.removeIf(r -> r.code.equalsIgnoreCase(code));
        gateway.write(state);
        return state.roles;
    }

    public synchronized List<Map<String, Object>> listUsers() {
        return gateway.read().users.stream().map(this::toUserSummary).toList();
    }

    public synchronized Map<String, Object> createUser(Map<String, Object> payload) {
        AppState state = gateway.read();
        UserRecord user = new UserRecord();
        user.id = "u-" + UUID.randomUUID();
        user.username = str(payload.get("username")).toLowerCase(Locale.ROOT);
        user.fullName = str(payload.get("full_name"));
        user.email = str(payload.get("email"));
        user.role = str(payload.get("role"));
        user.roles = extractStringList(payload.get("roles"), List.of(user.role));
        user.passwordHash = passwordEncoder.encode(str(payload.get("password")));
        user.isActive = true;
        user.status = "active";
        user.createdAt = now();
        user.updatedAt = now();
        state.users.add(user);
        gateway.write(state);
        return toUserSummary(user);
    }

    public synchronized Map<String, Object> updateUser(String userId, Map<String, Object> payload) {
        AppState state = gateway.read();
        UserRecord user = state.users.stream().filter(u -> Objects.equals(u.id, userId)).findFirst()
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable"));
        user.fullName = str(payload.get("full_name"));
        user.email = str(payload.get("email"));
        user.role = str(payload.get("role"));
        user.roles = extractStringList(payload.get("roles"), List.of(user.role));
        user.isActive = payload.get("is_active") == null || Boolean.TRUE.equals(payload.get("is_active"));
        user.status = strOrDefault(payload.get("status"), user.isActive ? "active" : "inactive");
        user.updatedAt = now();
        gateway.write(state);
        return toUserSummary(user);
    }

    public synchronized boolean deleteUser(String userId) {
        AppState state = gateway.read();
        boolean removed = state.users.removeIf(u -> Objects.equals(u.id, userId));
        gateway.write(state);
        return removed;
    }

    public synchronized List<WorkflowStepAssignment> listAssignments() {
        return gateway.read().workflowAssignments;
    }

    public synchronized WorkflowStepAssignment saveAssignment(String step, List<String> userIds, String workflowType) {
        AppState state = gateway.read();
        state.workflowAssignments.removeIf(a -> a.step.equalsIgnoreCase(step) && a.workflowType.equalsIgnoreCase(workflowType));
        WorkflowStepAssignment assignment = new WorkflowStepAssignment();
        assignment.step = step;
        assignment.userIds = userIds == null ? List.of() : userIds;
        assignment.workflowType = workflowType == null ? "facturation" : workflowType;
        state.workflowAssignments.add(assignment);
        gateway.write(state);
        return assignment;
    }

    public synchronized List<WorkflowStepAssignment> deleteAssignment(String step, String workflowType) {
        AppState state = gateway.read();
        state.workflowAssignments.removeIf(a -> a.step.equalsIgnoreCase(step)
                && a.workflowType.equalsIgnoreCase(workflowType == null ? "facturation" : workflowType));
        gateway.write(state);
        return state.workflowAssignments;
    }

    private Map<String, Object> toUserSummary(UserRecord user) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("id", user.id);
        summary.put("username", user.username);
        summary.put("full_name", user.fullName);
        summary.put("email", user.email);
        summary.put("role", user.role);
        summary.put("roles", user.roles == null || user.roles.isEmpty() ? List.of(user.role) : user.roles);
        summary.put("is_active", user.isActive);
        summary.put("status", user.status == null ? "active" : user.status);
        summary.put("created_at", user.createdAt);
        summary.put("updated_at", user.updatedAt);
        summary.put("last_login_at", user.lastLoginAt);
        return summary;
    }

    private String now() {
        return Instant.now().toString();
    }

    private String str(Object value) {
        if (value == null) {
            return "";
        }
        return String.valueOf(value);
    }

    private String strOrDefault(Object value, String defaultValue) {
        String s = str(value);
        return s.isBlank() ? defaultValue : s;
    }

    private double dbl(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return Double.parseDouble(String.valueOf(value));
    }

    private List<String> extractStringList(Object raw, List<String> fallback) {
        if (!(raw instanceof List<?> rawList)) {
            return fallback;
        }

        List<String> values = rawList.stream()
                .filter(Objects::nonNull)
                .map(String::valueOf)
                .filter(value -> !value.isBlank())
                .toList();

        return values.isEmpty() ? fallback : values;
    }
}
