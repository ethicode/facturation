package com.facturation.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ApproState {
    public List<BudgetLine> budgets = new ArrayList<>();
    public List<SupplyTicket> tickets = new ArrayList<>();
    public List<Map<String, String>> dirfinHistory = new ArrayList<>();
}
