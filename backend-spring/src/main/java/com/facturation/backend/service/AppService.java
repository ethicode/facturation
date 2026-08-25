package com.facturation.backend.service;

import com.facturation.backend.security.TokenService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.time.Instant;
import java.util.*;

@Service
public class AppService {
    private final JdbcTemplate jdbcTemplate;
    private final TokenService tokenService;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AppService(JdbcTemplate jdbcTemplate, TokenService tokenService, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.tokenService = tokenService;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void init() {
        seedIfNeeded();
    }

    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    public synchronized Map<String, Object> login(String username, String password) {
        List<Map<String, Object>> users = jdbcTemplate.queryForList(
                "SELECT id, username, full_name, email, role, password_hash, is_active, status, created_at, updated_at, last_login_at FROM users WHERE lower(username)=lower(?) LIMIT 1",
                username
        );
        if (users.isEmpty()) {
            throw new NoSuchElementException("Utilisateur introuvable");
        }

        Map<String, Object> user = users.getFirst();
        String hash = String.valueOf(user.get("password_hash"));
        if (!passwordEncoder.matches(password, hash)) {
            throw new IllegalArgumentException("Identifiants invalides");
        }

        String now = now();
        jdbcTemplate.update("UPDATE users SET updated_at=?, last_login_at=? WHERE id=?", now, now, user.get("id"));

        Map<String, Object> userSummary = userSummaryById(String.valueOf(user.get("id")));
        String token = tokenService.createToken(String.valueOf(user.get("id")), String.valueOf(user.get("username")), String.valueOf(user.get("role")));

        return Map.of("access_token", token, "token_type", "bearer", "user", userSummary);
    }

    public Map<String, Object> me(String bearerToken) {
        Map<String, Object> payload = tokenService.decode(bearerToken);
        String userId = String.valueOf(payload.get("sub"));
        return userSummaryById(userId);
    }

    public Map<String, Object> dashboard() {
        return Map.of(
                "kpi_metrics", readJsonRows("dashboard_kpi"),
                "missions", readJsonRows("dashboard_mission"),
                "trace_events", readJsonRows("dashboard_trace_event"),
                "budget_lines", readJsonRows("dashboard_budget_line")
        );
    }

    public Map<String, Object> workflowMeta() {
        List<Map<String, Object>> roleRows = jdbcTemplate.queryForList("SELECT code, label FROM roles ORDER BY position ASC");
        Map<String, String> roleLabels = new LinkedHashMap<>();
        List<String> roleCodes = new ArrayList<>();
        for (Map<String, Object> row : roleRows) {
            String code = String.valueOf(row.get("code"));
            roleCodes.add(code);
            roleLabels.put(code, String.valueOf(row.get("label")));
        }
        List<String> directions = jdbcTemplate.query("SELECT name FROM directions ORDER BY position ASC", (rs, i) -> rs.getString("name"));
        List<String> statuses = jdbcTemplate.query("SELECT status FROM facture_statuses ORDER BY position ASC", (rs, i) -> rs.getString("status"));

        return Map.of(
                "facture_statuses", statuses,
                "user_roles", roleCodes,
                "role_labels", roleLabels,
                "directions", directions
        );
    }

    public List<Map<String, Object>> workflowTasks() {
        List<Map<String, Object>> tasks = new ArrayList<>();

        for (Map<String, Object> facture : listFactures()) {
            List<Map<String, Object>> history = castListMap(facture.get("history"));
            Map<String, Object> latest = history.isEmpty() ? null : history.getFirst();
            tasks.add(new LinkedHashMap<>(Map.of(
                    "id", "facturation:" + facture.get("id"),
                    "workflow_type", "facturation",
                    "reference", facture.get("id"),
                    "step", facture.get("statut"),
                    "resolved_by", latest == null ? "" : latest.getOrDefault("actor", ""),
                    "resolved_at", latest == null ? "" : latest.getOrDefault("at", ""),
                    "assigned_users", List.of(),
                    "pieces_jointes", facture.getOrDefault("piecesJointes", List.of()),
                    "history", history
            )));
        }

        for (Map<String, Object> ticket : approState().tickets()) {
            List<Map<String, Object>> history = castListMap(ticket.get("history"));
            Map<String, Object> latest = history.isEmpty() ? null : history.getFirst();
            List<String> piecesJointes = new ArrayList<>();
            String fichierNom = stringValue(ticket.get("fichier_nom"));
            if (!fichierNom.isBlank()) {
                piecesJointes.add(fichierNom);
            }
            tasks.add(new LinkedHashMap<>(Map.of(
                    "id", "approvisionnement:" + ticket.get("id"),
                    "workflow_type", "approvisionnement",
                    "reference", ticket.get("id"),
                    "step", ticket.get("statut"),
                    "resolved_by", latest == null ? "" : latest.getOrDefault("actor", ""),
                    "resolved_at", latest == null ? "" : latest.getOrDefault("at", ""),
                    "assigned_users", List.of(),
                    "pieces_jointes", piecesJointes,
                    "history", history
            )));
        }

        return tasks;
    }

    public synchronized List<Map<String, Object>> listFactures() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, fournisseur, montant, devise, centre_cout, description, echeance, priorite, direction, resume, numero_facture, compte_charge, date_reception, mode_reception, statut FROM factures ORDER BY position ASC"
        );

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String factureId = stringValue(row.get("id"));
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", factureId);
            item.put("fournisseur", stringValue(row.get("fournisseur")));
            item.put("montant", numberValue(row.get("montant")));
            item.put("devise", stringValue(row.get("devise")));
            item.put("centreCout", stringValue(row.get("centre_cout")));
            item.put("description", stringValue(row.get("description")));
            item.put("echeance", stringValue(row.get("echeance")));
            item.put("priorite", stringValue(row.get("priorite")));
            item.put("direction", stringValue(row.get("direction")));
            item.put("resume", stringValue(row.get("resume")));
            item.put("numeroFacture", stringValue(row.get("numero_facture")));
            item.put("compteCharge", stringValue(row.get("compte_charge")));
            item.put("dateReception", stringValue(row.get("date_reception")));
            item.put("modeReception", stringValue(row.get("mode_reception")));
            item.put("statut", stringValue(row.get("statut")));
            item.put("piecesJointes", jdbcTemplate.query(
                    "SELECT value FROM facture_attachments WHERE facture_id = ? ORDER BY position ASC",
                    (rs, i) -> rs.getString("value"),
                    factureId
            ));
            item.put("history", factureHistory(factureId));
            result.add(item);
        }
        return result;
    }

    public synchronized Map<String, Object> getFacture(String factureId) {
        return listFactures().stream()
                .filter(f -> factureId.equals(stringValue(f.get("id"))))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Facture introuvable"));
    }

    public synchronized Map<String, Object> createFacture(Map<String, Object> payload) {
        String id = "FAC-" + System.currentTimeMillis();
        int position = nextPosition("factures");
        String centreCout = stringValue(payload.get("centreCout"));
        String echeance = stringValue(payload.get("echeance"));

        jdbcTemplate.update(
                "INSERT INTO factures(id, fournisseur, montant, devise, centre_cout, description, echeance, priorite, direction, resume, numero_facture, compte_charge, date_reception, mode_reception, statut, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                id,
                stringValue(payload.get("fournisseur")),
                numberValue(payload.get("montant")),
                nonBlank(payload.get("devise"), "EUR"),
                centreCout,
                stringValue(payload.get("description")),
                echeance,
                stringValue(payload.get("priorite")),
                stringValue(payload.get("direction")),
                stringValue(payload.get("resume")),
                stringValue(payload.get("numeroFacture")),
                nonBlank(payload.get("compteCharge"), centreCout),
                nonBlank(payload.get("dateReception"), echeance),
                stringValue(payload.get("modeReception")),
                "Vérification métier",
                position
        );

        List<String> piecesJointes = castStringList(payload.get("piecesJointes"));
        for (int i = 0; i < piecesJointes.size(); i++) {
            jdbcTemplate.update("INSERT INTO facture_attachments(facture_id, position, value) VALUES (?, ?, ?)", id, i, piecesJointes.get(i));
        }

        jdbcTemplate.update(
                "INSERT INTO facture_history(facture_id, position, at, actor, email, action, role, detail, commentaire) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                id,
                0,
                now(),
                nonBlank(payload.get("actor"), "Systeme"),
                null,
                "Demande soumise et étape de saisie validée automatiquement",
                nonBlank(payload.get("role"), "utilisateur"),
                null,
                ""
        );

        return getFacture(id);
    }

    public synchronized List<Map<String, Object>> deleteFacture(String factureId) {
        jdbcTemplate.update("DELETE FROM facture_history_attachments WHERE history_id IN (SELECT id FROM facture_history WHERE facture_id = ?)", factureId);
        jdbcTemplate.update("DELETE FROM facture_history WHERE facture_id = ?", factureId);
        jdbcTemplate.update("DELETE FROM facture_attachments WHERE facture_id = ?", factureId);
        jdbcTemplate.update("DELETE FROM factures WHERE id = ?", factureId);
        return listFactures();
    }

    public synchronized Map<String, Object> updateFactureStatus(String factureId, Map<String, Object> payload) {
        String nextStatus = stringValue(payload.get("next_status"));
        String finalStatus = "Paiement effectué".equals(nextStatus) ? "Clôturée" : nextStatus;
        jdbcTemplate.update("UPDATE factures SET statut=? WHERE id=?", finalStatus, factureId);

        int position = nextHistoryPosition("facture_history", "facture_id", factureId);
        jdbcTemplate.update(
                "INSERT INTO facture_history(facture_id, position, at, actor, email, action, role, detail, commentaire) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                factureId,
                position,
                now(),
                nonBlank(payload.get("actor"), "Systeme Workflow"),
                stringValue(payload.get("email")),
                nonBlank(payload.get("action_label"), "Statut passe a " + nextStatus),
                nonBlank(payload.get("role"), "utilisateur"),
                null,
                stringValue(payload.get("commentaire"))
        );

        return getFacture(factureId);
    }

    public synchronized Map<String, Object> appro() {
        ApproSnapshot snapshot = approState();
        return Map.of(
                "budgets", snapshot.budgets,
                "tickets", snapshot.tickets,
                "dirfinHistory", snapshot.dirfinHistory
        );
    }

    public synchronized Map<String, Object> saveBudget(Map<String, Object> payload) {
        String direction = stringValue(payload.get("direction"));
        int updated = jdbcTemplate.update(
                "UPDATE budgets SET allocated=?, engaged=?, allocated_by=? WHERE direction=?",
                numberValue(payload.get("allocated")),
                numberValue(payload.get("engaged")),
                nonBlank(payload.get("allocatedBy"), "DirFin"),
                direction
        );
        if (updated == 0) {
            jdbcTemplate.update(
                    "INSERT INTO budgets(direction, allocated, engaged, allocated_by, position) VALUES (?, ?, ?, ?, ?)",
                    direction,
                    numberValue(payload.get("allocated")),
                    numberValue(payload.get("engaged")),
                    nonBlank(payload.get("allocatedBy"), "DirFin"),
                    nextPosition("budgets")
            );
        }
        return appro();
    }

    public synchronized Map<String, Object> deleteBudget(String direction) {
        jdbcTemplate.update("DELETE FROM budgets WHERE direction = ?", direction);
        return Map.of("state", appro(), "error", "");
    }

    public synchronized Map<String, Object> createTicket(Map<String, Object> payload) {
        String id = "APPRO-" + System.currentTimeMillis();
        jdbcTemplate.update(
                "INSERT INTO tickets(id, direction, objet, montant, devise, titre_demande, domaine, sous_domaine, action_demande, date_debut_souhaitee, date_fin_souhaitee, direction_demandeur, budget_previsionnel, priorite, description, commentaire, fichier_nom, statut, linked_facture_id, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                id,
                stringValue(payload.get("direction")),
                stringValue(payload.get("objet")),
                numberValue(payload.get("montant")),
                nonBlank(payload.get("devise"), "XAF"),
                stringValue(payload.get("titre_demande")),
                stringValue(payload.get("domaine")),
                stringValue(payload.get("sous_domaine")),
                stringValue(payload.get("action_demande")),
                stringValue(payload.get("date_debut_souhaitee")),
                stringValue(payload.get("date_fin_souhaitee")),
                stringValue(payload.get("direction_demandeur")),
                numberValue(payload.get("budget_previsionnel")),
                stringValue(payload.get("priorite")),
                stringValue(payload.get("description")),
                stringValue(payload.get("commentaire")),
                stringValue(payload.get("fichier_nom")),
                "Initialisation",
                "",
                nextPosition("tickets")
        );

        jdbcTemplate.update(
                "INSERT INTO ticket_history(ticket_id, position, at, actor, email, action, role, detail, commentaire) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                id,
                0,
                now(),
                nonBlank(payload.get("actor"), "Demandeur"),
                null,
                "Ticket créé",
                "utilisateur",
                null,
                ""
        );

        return ticketById(id);
    }

    public synchronized Map<String, Object> deleteTicket(String ticketId) {
        jdbcTemplate.update("DELETE FROM ticket_history_attachments WHERE history_id IN (SELECT id FROM ticket_history WHERE ticket_id=?)", ticketId);
        jdbcTemplate.update("DELETE FROM ticket_history WHERE ticket_id=?", ticketId);
        jdbcTemplate.update("DELETE FROM tickets WHERE id=?", ticketId);
        return appro();
    }

    public synchronized Map<String, Object> verifyTicket(String ticketId, String actor) {
        jdbcTemplate.update("UPDATE tickets SET statut='En cours' WHERE id=?", ticketId);
        appendTicketHistory(ticketId, actor, "Budget vérifié");
        return appro();
    }

    public synchronized Map<String, Object> closeTicket(String ticketId, String actor) {
        jdbcTemplate.update("UPDATE tickets SET statut='Transférée en facturation' WHERE id=?", ticketId);
        appendTicketHistory(ticketId, actor, "Ticket clos");
        return appro();
    }

    public synchronized List<Map<String, Object>> listDirections() {
        return jdbcTemplate.query("SELECT name FROM directions ORDER BY position ASC",
                (rs, i) -> new LinkedHashMap<>(Map.of("name", rs.getString("name"))));
    }

    public synchronized List<Map<String, Object>> createDirection(String name) {
        if (jdbcTemplate.queryForObject("SELECT COUNT(*) FROM directions WHERE lower(name)=lower(?)", Integer.class, name) == 0) {
            jdbcTemplate.update("INSERT INTO directions(name, position) VALUES(?, ?)", name, nextPosition("directions"));
        }
        return listDirections();
    }

    public synchronized List<Map<String, Object>> updateDirection(String currentName, String newName) {
        jdbcTemplate.update("UPDATE directions SET name=? WHERE lower(name)=lower(?)", newName, currentName);
        jdbcTemplate.update("UPDATE budgets SET direction=? WHERE lower(direction)=lower(?)", newName, currentName);
        jdbcTemplate.update("UPDATE tickets SET direction=? WHERE lower(direction)=lower(?)", newName, currentName);
        return listDirections();
    }

    public synchronized List<Map<String, Object>> deleteDirection(String name) {
        jdbcTemplate.update("DELETE FROM directions WHERE lower(name)=lower(?)", name);
        return listDirections();
    }

    public synchronized List<Map<String, Object>> listRoles() {
        return jdbcTemplate.query("SELECT code, label FROM roles ORDER BY position ASC",
                (rs, i) -> new LinkedHashMap<>(Map.of("code", rs.getString("code"), "label", rs.getString("label"))));
    }

    public synchronized List<Map<String, Object>> createRole(Map<String, Object> payload) {
        String code = stringValue(payload.get("code"));
        String label = stringValue(payload.get("label"));
        if (jdbcTemplate.queryForObject("SELECT COUNT(*) FROM roles WHERE lower(code)=lower(?)", Integer.class, code) == 0) {
            jdbcTemplate.update("INSERT INTO roles(code, label, position) VALUES(?, ?, ?)", code, label, nextPosition("roles"));
        }
        return listRoles();
    }

    public synchronized List<Map<String, Object>> updateRole(String roleCode, String label) {
        jdbcTemplate.update("UPDATE roles SET label=? WHERE lower(code)=lower(?)", label, roleCode);
        return listRoles();
    }

    public synchronized List<Map<String, Object>> deleteRole(String roleCode) {
        jdbcTemplate.update("DELETE FROM roles WHERE lower(code)=lower(?)", roleCode);
        jdbcTemplate.update("DELETE FROM user_roles WHERE lower(role_code)=lower(?)", roleCode);
        return listRoles();
    }

    public synchronized List<Map<String, Object>> listUsers() {
        List<Map<String, Object>> users = jdbcTemplate.queryForList(
                "SELECT id, username, full_name, email, role, is_active, status, created_at, updated_at, last_login_at FROM users ORDER BY username ASC"
        );
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> u : users) {
            result.add(userSummaryById(stringValue(u.get("id"))));
        }
        return result;
    }

    public synchronized Map<String, Object> createUser(Map<String, Object> payload) {
        String userId = "u-" + UUID.randomUUID();
        String now = now();
        String role = stringValue(payload.get("role"));

        jdbcTemplate.update(
                "INSERT INTO users(id, username, full_name, email, role, password_hash, is_active, status, created_at, updated_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                userId,
                stringValue(payload.get("username")).toLowerCase(Locale.ROOT),
                stringValue(payload.get("full_name")),
                stringValue(payload.get("email")).toLowerCase(Locale.ROOT),
                role,
                passwordEncoder.encode(stringValue(payload.get("password"))),
                1,
                "active",
                now,
                now,
                null
        );

        List<String> roles = castStringList(payload.get("roles"));
        if (roles.isEmpty()) {
            roles = List.of(role);
        }
        for (int i = 0; i < roles.size(); i++) {
            jdbcTemplate.update("INSERT INTO user_roles(user_id, role_code, position) VALUES (?, ?, ?)", userId, roles.get(i), i);
        }

        return userSummaryById(userId);
    }

    public synchronized Map<String, Object> updateUser(String userId, Map<String, Object> payload) {
        String role = stringValue(payload.get("role"));
        boolean isActive = payload.get("is_active") == null || Boolean.TRUE.equals(payload.get("is_active"));
        String status = nonBlank(payload.get("status"), isActive ? "active" : "inactive");

        jdbcTemplate.update(
                "UPDATE users SET full_name=?, email=?, role=?, is_active=?, status=?, updated_at=? WHERE id=?",
                stringValue(payload.get("full_name")),
                stringValue(payload.get("email")).toLowerCase(Locale.ROOT),
                role,
                isActive ? 1 : 0,
                status,
                now(),
                userId
        );

        jdbcTemplate.update("DELETE FROM user_roles WHERE user_id=?", userId);
        List<String> roles = castStringList(payload.get("roles"));
        if (roles.isEmpty()) {
            roles = List.of(role);
        }
        for (int i = 0; i < roles.size(); i++) {
            jdbcTemplate.update("INSERT INTO user_roles(user_id, role_code, position) VALUES (?, ?, ?)", userId, roles.get(i), i);
        }

        return userSummaryById(userId);
    }

    public synchronized boolean deleteUser(String userId) {
        jdbcTemplate.update("DELETE FROM user_roles WHERE user_id=?", userId);
        return jdbcTemplate.update("DELETE FROM users WHERE id=?", userId) > 0;
    }

    public synchronized List<Map<String, Object>> listAssignments() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT step, workflow_type, user_id FROM workflow_assignments ORDER BY workflow_type, step, position"
        );
        Map<String, Map<String, Object>> grouped = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            String step = stringValue(row.get("step"));
            String workflowType = stringValue(row.get("workflow_type"));
            String key = workflowType + "::" + step;
            Map<String, Object> value = grouped.computeIfAbsent(key, k -> {
                Map<String, Object> v = new LinkedHashMap<>();
                v.put("step", step);
                v.put("workflow_type", workflowType);
                v.put("user_ids", new ArrayList<String>());
                return v;
            });
            ((List<String>) value.get("user_ids")).add(stringValue(row.get("user_id")));
        }
        return new ArrayList<>(grouped.values());
    }

    public synchronized Map<String, Object> saveAssignment(String step, String workflowType, List<String> userIds) {
        jdbcTemplate.update("DELETE FROM workflow_assignments WHERE step=? AND workflow_type=?", step, workflowType);
        List<String> safeUserIds = userIds == null ? List.of() : userIds;
        for (int i = 0; i < safeUserIds.size(); i++) {
            jdbcTemplate.update("INSERT INTO workflow_assignments(step, workflow_type, user_id, position) VALUES (?, ?, ?, ?)", step, workflowType, safeUserIds.get(i), i);
        }
        return new LinkedHashMap<>(Map.of("step", step, "workflow_type", workflowType, "user_ids", safeUserIds));
    }

    public synchronized List<Map<String, Object>> deleteAssignment(String step, String workflowType) {
        jdbcTemplate.update("DELETE FROM workflow_assignments WHERE step=? AND workflow_type=?", step, workflowType);
        return listAssignments();
    }

    private void seedIfNeeded() {
        Integer userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        if (userCount != null && userCount > 0) {
            return;
        }

        jdbcTemplate.update("INSERT INTO roles(code, label, position) VALUES ('admin', 'Administrateur', 0)");
        jdbcTemplate.update("INSERT INTO roles(code, label, position) VALUES ('appro', 'Approvisionnement', 1)");
        jdbcTemplate.update("INSERT INTO roles(code, label, position) VALUES ('dirfin', 'Direction Financiere', 2)");

        String now = now();
        String adminHash = passwordEncoder.encode("admin123");
        jdbcTemplate.update(
                "INSERT INTO users(id, username, full_name, email, role, password_hash, is_active, status, created_at, updated_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "u-admin", "admin", "Admin", "admin@facturation.local", "admin", adminHash, 1, "active", now, now, null
        );
        jdbcTemplate.update("INSERT INTO user_roles(user_id, role_code, position) VALUES ('u-admin', 'admin', 0)");

        jdbcTemplate.update("INSERT INTO directions(name, position) VALUES ('DSI', 0)");
        jdbcTemplate.update("INSERT INTO directions(name, position) VALUES ('Achats', 1)");
        jdbcTemplate.update("INSERT INTO directions(name, position) VALUES ('Finance', 2)");

        List<String> statuses = List.of(
                "Vérification métier",
                "Validation métier N+1",
                "Traitement service approvisionnement",
                "Signature LAD 1",
                "Signature LAD 2",
                "Signature LAD 3",
                "Règlement en cours",
                "Paiement effectué",
                "Clôturée",
                "Rejetée"
        );
        for (int i = 0; i < statuses.size(); i++) {
            jdbcTemplate.update("INSERT INTO facture_statuses(status, position) VALUES (?, ?)", statuses.get(i), i);
        }

        writeJsonRows("dashboard_kpi", List.of(Map.of("label", "Demandes actives", "value", "0", "trend", "stable", "tone", "neutral")));
    }

    private Map<String, Object> userSummaryById(String userId) {
        List<Map<String, Object>> users = jdbcTemplate.queryForList(
                "SELECT id, username, full_name, email, role, is_active, status, created_at, updated_at, last_login_at FROM users WHERE id=? LIMIT 1",
                userId
        );
        if (users.isEmpty()) {
            throw new NoSuchElementException("Utilisateur introuvable");
        }
        Map<String, Object> user = users.getFirst();
        List<String> roles = jdbcTemplate.query(
                "SELECT role_code FROM user_roles WHERE user_id=? ORDER BY position ASC",
                (rs, i) -> rs.getString("role_code"),
                userId
        );

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("id", user.get("id"));
        summary.put("username", user.get("username"));
        summary.put("full_name", user.get("full_name"));
        summary.put("email", user.get("email"));
        summary.put("role", user.get("role"));
        summary.put("roles", roles.isEmpty() ? List.of(user.get("role")) : roles);
        summary.put("is_active", ((Number) user.get("is_active")).intValue() == 1);
        summary.put("status", user.get("status"));
        summary.put("created_at", user.get("created_at"));
        summary.put("updated_at", user.get("updated_at"));
        summary.put("last_login_at", user.get("last_login_at"));
        return summary;
    }

    private ApproSnapshot approState() {
        List<Map<String, Object>> budgets = jdbcTemplate.queryForList(
                "SELECT direction, allocated, engaged, allocated_by FROM budgets ORDER BY position ASC"
        );

        List<Map<String, Object>> tickets = jdbcTemplate.queryForList(
                "SELECT id, direction, objet, montant, devise, titre_demande, domaine, sous_domaine, action_demande, date_debut_souhaitee, date_fin_souhaitee, direction_demandeur, budget_previsionnel, priorite, description, commentaire, fichier_nom, statut, linked_facture_id FROM tickets ORDER BY position ASC"
        );

        List<Map<String, Object>> normalizedTickets = new ArrayList<>();
        for (Map<String, Object> t : tickets) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", t.get("id"));
            item.put("direction", stringValue(t.get("direction")));
            item.put("objet", stringValue(t.get("objet")));
            item.put("montant", numberValue(t.get("montant")));
            item.put("devise", stringValue(t.get("devise")));
            item.put("titre_demande", stringValue(t.get("titre_demande")));
            item.put("domaine", stringValue(t.get("domaine")));
            item.put("sous_domaine", stringValue(t.get("sous_domaine")));
            item.put("action_demande", stringValue(t.get("action_demande")));
            item.put("date_debut_souhaitee", stringValue(t.get("date_debut_souhaitee")));
            item.put("date_fin_souhaitee", stringValue(t.get("date_fin_souhaitee")));
            item.put("direction_demandeur", stringValue(t.get("direction_demandeur")));
            item.put("budget_previsionnel", numberValue(t.get("budget_previsionnel")));
            item.put("priorite", stringValue(t.get("priorite")));
            item.put("description", stringValue(t.get("description")));
            item.put("commentaire", stringValue(t.get("commentaire")));
            item.put("fichier_nom", stringValue(t.get("fichier_nom")));
            item.put("statut", stringValue(t.get("statut")));
            item.put("linkedFactureId", stringValue(t.get("linked_facture_id")));
            item.put("history", ticketHistory(stringValue(t.get("id"))));
            normalizedTickets.add(item);
        }

        List<Map<String, String>> dirfinHistory = new ArrayList<>();
        List<String> payloads = jdbcTemplate.query("SELECT payload FROM dirfin_history ORDER BY position ASC", (rs, i) -> rs.getString("payload"));
        for (String payload : payloads) {
            try {
                dirfinHistory.add(objectMapper.readValue(payload, new TypeReference<>() {
                }));
            } catch (Exception ex) {
                throw new IllegalStateException("Cannot decode dirfin history", ex);
            }
        }

        return new ApproSnapshot(budgets, normalizedTickets, dirfinHistory);
    }

    private Map<String, Object> ticketById(String id) {
        return approState().tickets.stream()
                .filter(t -> id.equals(stringValue(t.get("id"))))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Ticket introuvable"));
    }

    private void appendTicketHistory(String ticketId, String actor, String action) {
        jdbcTemplate.update(
                "INSERT INTO ticket_history(ticket_id, position, at, actor, email, action, role, detail, commentaire) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ticketId,
                nextHistoryPosition("ticket_history", "ticket_id", ticketId),
                now(),
                actor,
                null,
                action,
                "utilisateur",
                null,
                ""
        );
    }

    private List<Map<String, Object>> factureHistory(String factureId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, at, actor, email, action, role, detail, commentaire FROM facture_history WHERE facture_id=? ORDER BY position ASC",
                factureId
        );
        List<Map<String, Object>> history = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            long historyId = ((Number) r.get("id")).longValue();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("at", stringValue(r.get("at")));
            entry.put("actor", stringValue(r.get("actor")));
            entry.put("email", stringValue(r.get("email")));
            entry.put("action", stringValue(r.get("action")));
            entry.put("role", stringValue(r.get("role")));
            entry.put("detail", stringValue(r.get("detail")));
            entry.put("commentaire", stringValue(r.get("commentaire")));
            entry.put("piecesJointes", jdbcTemplate.query(
                    "SELECT value FROM facture_history_attachments WHERE history_id=? ORDER BY position ASC",
                    (rs, i) -> rs.getString("value"),
                    historyId
            ));
            history.add(entry);
        }
        return history;
    }

    private List<Map<String, Object>> ticketHistory(String ticketId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, at, actor, email, action, role, detail, commentaire FROM ticket_history WHERE ticket_id=? ORDER BY position ASC",
                ticketId
        );
        List<Map<String, Object>> history = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            long historyId = ((Number) r.get("id")).longValue();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("at", stringValue(r.get("at")));
            entry.put("actor", stringValue(r.get("actor")));
            entry.put("email", stringValue(r.get("email")));
            entry.put("action", stringValue(r.get("action")));
            entry.put("role", stringValue(r.get("role")));
            entry.put("detail", stringValue(r.get("detail")));
            entry.put("commentaire", stringValue(r.get("commentaire")));
            entry.put("piecesJointes", jdbcTemplate.query(
                    "SELECT value FROM ticket_history_attachments WHERE history_id=? ORDER BY position ASC",
                    (rs, i) -> rs.getString("value"),
                    historyId
            ));
            history.add(entry);
        }
        return history;
    }

    private List<Map<String, String>> readJsonRows(String table) {
        List<Map<String, String>> result = new ArrayList<>();
        List<String> payloads = jdbcTemplate.query("SELECT payload FROM " + table + " ORDER BY position ASC", (rs, i) -> rs.getString("payload"));
        for (String payload : payloads) {
            try {
                result.add(objectMapper.readValue(payload, new TypeReference<>() {
                }));
            } catch (Exception ex) {
                throw new IllegalStateException("Cannot decode payload for " + table, ex);
            }
        }
        return result;
    }

    private void writeJsonRows(String table, List<?> payloads) {
        jdbcTemplate.update("DELETE FROM " + table);
        for (int i = 0; i < payloads.size(); i++) {
            try {
                jdbcTemplate.update("INSERT INTO " + table + "(position, payload) VALUES (?, ?)", i, objectMapper.writeValueAsString(payloads.get(i)));
            } catch (Exception ex) {
                throw new IllegalStateException("Cannot write payload for " + table, ex);
            }
        }
    }

    private int nextPosition(String table) {
        Integer max = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(position), -1) FROM " + table, Integer.class);
        return (max == null ? -1 : max) + 1;
    }

    private int nextHistoryPosition(String table, String fkColumn, String fkValue) {
        Integer max = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(position), -1) FROM " + table + " WHERE " + fkColumn + "=?",
                Integer.class,
                fkValue
        );
        return (max == null ? -1 : max) + 1;
    }

    private String now() {
        return Instant.now().toString();
    }

    private String stringValue(Object raw) {
        return raw == null ? "" : String.valueOf(raw);
    }

    private String nonBlank(Object raw, String fallback) {
        String v = stringValue(raw);
        return v.isBlank() ? fallback : v;
    }

    private double numberValue(Object raw) {
        if (raw == null) {
            return 0;
        }
        if (raw instanceof Number n) {
            return n.doubleValue();
        }
        String value = String.valueOf(raw).trim();
        if (value.isEmpty()) {
            return 0;
        }
        return Double.parseDouble(value);
    }

    private List<String> castStringList(Object raw) {
        if (!(raw instanceof List<?> list)) {
            return new ArrayList<>();
        }
        List<String> values = new ArrayList<>();
        for (Object item : list) {
            if (item != null) {
                String value = String.valueOf(item);
                if (!value.isBlank()) {
                    values.add(value);
                }
            }
        }
        return values;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castListMap(Object raw) {
        if (!(raw instanceof List<?> list)) {
            return List.of();
        }
        return (List<Map<String, Object>>) list;
    }

    private record ApproSnapshot(List<Map<String, Object>> budgets,
                                 List<Map<String, Object>> tickets,
                                 List<Map<String, String>> dirfinHistory) {
    }
}
