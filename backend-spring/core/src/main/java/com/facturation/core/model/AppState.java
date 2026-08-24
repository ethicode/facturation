package com.facturation.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AppState {
    public List<UserRecord> users = new ArrayList<>();
    public List<RoleDefinition> roles = new ArrayList<>();
    public List<String> directions = new ArrayList<>();
    public List<WorkflowStepAssignment> workflowAssignments = new ArrayList<>();

    public List<String> factureStatuses = new ArrayList<>();
    public List<FactureRecord> factures = new ArrayList<>();

    public ApproState appro = new ApproState();

    public List<Map<String, String>> kpiMetrics = new ArrayList<>();
    public List<Map<String, String>> missions = new ArrayList<>();
    public List<Map<String, String>> traceEvents = new ArrayList<>();
    public List<Map<String, Object>> budgetLines = new ArrayList<>();

    public static AppState seed() {
        AppState state = new AppState();

        RoleDefinition admin = new RoleDefinition();
        admin.code = "admin";
        admin.label = "Administrateur";
        state.roles.add(admin);

        RoleDefinition appro = new RoleDefinition();
        appro.code = "appro";
        appro.label = "Approvisionnement";
        state.roles.add(appro);

        RoleDefinition dirfin = new RoleDefinition();
        dirfin.code = "dirfin";
        dirfin.label = "Direction Financiere";
        state.roles.add(dirfin);

        UserRecord user = new UserRecord();
        user.id = "u-admin";
        user.username = "admin";
        user.fullName = "Admin";
        user.email = "admin@facturation.local";
        user.role = "admin";
        user.roles = new ArrayList<>(List.of("admin"));
        user.passwordHash = "";
        user.isActive = true;
        user.status = "active";
        state.users.add(user);

        state.directions.addAll(List.of("DSI", "Achats", "Finance"));
        state.factureStatuses.addAll(List.of(
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
        ));

        Map<String, String> kpi = new LinkedHashMap<>();
        kpi.put("label", "Demandes actives");
        kpi.put("value", "0");
        kpi.put("trend", "stable");
        kpi.put("tone", "neutral");
        state.kpiMetrics.add(kpi);

        return state;
    }
}
