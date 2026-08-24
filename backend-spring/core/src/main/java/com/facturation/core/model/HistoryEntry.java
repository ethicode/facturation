package com.facturation.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class HistoryEntry {
    public String at;
    public String actor;
    public String email;
    public String action;
    public String role;
    public String detail;
    public String commentaire = "";
    public List<String> piecesJointes = new ArrayList<>();
}
