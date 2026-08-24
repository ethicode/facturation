package com.facturation.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FactureRecord {
    public String id;
    public String fournisseur;
    public double montant;
    public String devise;
    public String centreCout;
    public String description;
    public String echeance;
    public String priorite = "";
    public String direction = "";
    public String resume = "";
    public String numeroFacture = "";
    public String compteCharge = "";
    public String dateReception = "";
    public String modeReception = "";
    public List<String> piecesJointes = new ArrayList<>();
    public String statut;
    public List<HistoryEntry> history = new ArrayList<>();
}
