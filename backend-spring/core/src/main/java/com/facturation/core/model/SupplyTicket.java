package com.facturation.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SupplyTicket {
    public String id;
    public String direction = "";
    public String objet = "";
    public double montant = 0;
    public String devise = "XAF";
    public String titre_demande = "";
    public String domaine = "";
    public String sous_domaine = "";
    public String action_demande = "";
    public String date_debut_souhaitee = "";
    public String date_fin_souhaitee = "";
    public String direction_demandeur = "";
    public double budget_previsionnel = 0;
    public String priorite = "";
    public String description = "";
    public String commentaire = "";
    public String fichier_nom = "";
    public String statut = "Initialisation";
    public String linkedFactureId = "";
    public List<HistoryEntry> history = new ArrayList<>();
}
