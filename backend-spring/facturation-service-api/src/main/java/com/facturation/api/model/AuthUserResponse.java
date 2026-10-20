package com.facturation.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** Profil utilisateur exposé par l'API ; le hash du mot de passe n'est jamais renvoyé. */
public record AuthUserResponse(
        String id,
        String username,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("first_name") String firstName,
        @JsonProperty("last_name") String lastName,
        String email,
        @JsonProperty("employee_id") String employeeId,
        String department,
        @JsonProperty("job_title") String jobTitle,
        @JsonProperty("phone_number") String phoneNumber,
        String locale,
        String timezone,
        String role,
        List<String> roles,
        @JsonProperty("is_active") boolean active,
        String status,
        @JsonProperty("created_at") String createdAt,
        @JsonProperty("updated_at") String updatedAt,
        @JsonProperty("last_login_at") String lastLoginAt) {
}
