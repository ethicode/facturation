package com.facturation.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BudgetLine {
    public String direction;
    public double allocated;
    public double engaged;
    public String allocatedBy;
}
