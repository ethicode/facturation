package com.facturation.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UserRecord {
    public String id;
    public String username;
    public String fullName;
    public String email;
    public String role;
    public List<String> roles = new ArrayList<>();
    public String passwordHash;
    public boolean isActive;
    public String status;
    public String createdAt;
    public String updatedAt;
    public String lastLoginAt;
}
