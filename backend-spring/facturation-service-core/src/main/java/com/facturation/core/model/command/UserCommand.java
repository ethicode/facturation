package com.facturation.core.model.command;

import java.util.List;

/** Données de création ou de mise à jour d'un utilisateur. {@code username}/{@code password} ne servent qu'à la création. */
public record UserCommand(
        String username,
        String password,
        String fullName,
        String firstName,
        String lastName,
        String employeeId,
        String department,
        String jobTitle,
        String phoneNumber,
        String managerId,
        String locale,
        String timezone,
        String role,
        List<String> roles,
        String email,
        Boolean active,
        String status) {
}
