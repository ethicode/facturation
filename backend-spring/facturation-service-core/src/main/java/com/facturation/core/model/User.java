package com.facturation.core.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private String id;
    private String username;
    private String fullName;
    private String firstName;
    private String lastName;
    private String email;
    private String employeeId;
    private String department;
    private String jobTitle;
    private String phoneNumber;
    private String managerId;
    @Builder.Default
    private String locale = "fr-FR";
    @Builder.Default
    private String timezone = "Africa/Dakar";
    /** Rôle principal, toujours en tête de {@link #roles}. */
    private String role;
    @Builder.Default
    private List<String> roles = new ArrayList<>();
    private String passwordHash;
    @Builder.Default
    private boolean active = true;
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLoginAt;

    public boolean hasAnyRole(String... codes) {
        for (String code : codes) {
            if (roles.contains(code) || code.equals(role)) {
                return true;
            }
        }
        return false;
    }
}
