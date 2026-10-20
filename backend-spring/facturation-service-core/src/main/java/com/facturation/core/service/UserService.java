package com.facturation.core.service;

import com.facturation.core.exception.BusinessException;
import com.facturation.core.model.Role;
import com.facturation.core.model.User;
import com.facturation.core.model.UserStatus;
import com.facturation.core.model.command.UserCommand;
import com.facturation.core.port.PasswordHasher;
import com.facturation.core.port.RoleGateway;
import com.facturation.core.port.UserGateway;
import com.facturation.core.util.Identifiers;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    static final String MAIN_ADMIN_USERNAME = "admin";

    private final UserGateway userGateway;
    private final RoleGateway roleGateway;
    private final PasswordHasher passwordHasher;

    @Transactional(readOnly = true)
    public List<User> list() {
        return userGateway.findAll();
    }

    public User create(UserCommand command) {
        String username = Identifiers.lower(command.username());
        if (username.isEmpty() || command.password() == null || command.password().isEmpty()) {
            throw BusinessException.badRequest("L'identifiant et le mot de passe sont obligatoires.");
        }
        if (userGateway.findByUsernameIgnoreCase(username).isPresent()) {
            throw BusinessException.conflict("Cet identifiant existe déjà.");
        }

        String email = requireUniqueEmail(command.email(), null);
        List<String> roles = normalizeRoles(command.role(), command.roles());
        validateManager(command.managerId(), null);

        Instant now = Instant.now();
        User user = User.builder()
                .id(Identifiers.sequentialReference("USR-", userGateway.findAllIds()))
                .username(username)
                .passwordHash(passwordHasher.hash(command.password()))
                .email(email)
                .role(roles.get(0))
                .roles(roles)
                .active(true)
                .status(UserStatus.ACTIVE)
                .createdAt(now)
                .updatedAt(now)
                .build();
        applyProfile(user, command);
        return userGateway.save(user);
    }

    public User update(String userId, UserCommand command) {
        User user = userGateway.findById(userId).orElseThrow(() -> BusinessException.notFound("Utilisateur introuvable."));
        List<String> roles = normalizeRoles(command.role(), command.roles());

        UserStatus status = command.status() != null && !command.status().isBlank()
                ? parseStatus(command.status())
                : (Boolean.FALSE.equals(command.active()) ? UserStatus.INACTIVE : UserStatus.ACTIVE);
        boolean active = status == UserStatus.ACTIVE && !Boolean.FALSE.equals(command.active());
        if (!active && status == UserStatus.ACTIVE) {
            status = UserStatus.INACTIVE;
        }

        if (MAIN_ADMIN_USERNAME.equalsIgnoreCase(user.getUsername()) && !active) {
            throw BusinessException.badRequest("L'administrateur principal doit rester actif.");
        }

        String email = requireUniqueEmail(command.email(), user.getId());
        if (command.managerId() != null && command.managerId().equals(user.getId())) {
            throw BusinessException.badRequest("Un utilisateur ne peut pas être son propre manager.");
        }
        validateManager(command.managerId(), user.getId());

        user.setEmail(email);
        user.setRole(roles.get(0));
        user.setRoles(roles);
        user.setActive(active);
        user.setStatus(status);
        user.setUpdatedAt(Instant.now());
        applyProfile(user, command);
        return userGateway.save(user);
    }

    public void delete(String userId) {
        User user = userGateway.findById(userId).orElseThrow(() -> BusinessException.notFound("Utilisateur introuvable."));
        if (MAIN_ADMIN_USERNAME.equalsIgnoreCase(user.getUsername())) {
            throw BusinessException.badRequest("L'administrateur principal ne peut pas être supprimé.");
        }
        userGateway.deleteById(userId);
    }

    private void applyProfile(User user, UserCommand command) {
        String fullName = Identifiers.normalize(command.fullName());
        String firstName = Identifiers.blankToNull(command.firstName());
        String lastName = Identifiers.blankToNull(command.lastName());

        if (fullName.isEmpty() && (firstName != null || lastName != null)) {
            fullName = String.join(" ", firstName == null ? "" : firstName, lastName == null ? "" : lastName).strip();
        }
        if (!fullName.isEmpty() && (firstName == null || lastName == null)) {
            String[] parts = fullName.split("\\s+");
            if (firstName == null) {
                firstName = parts[0];
            }
            if (lastName == null && parts.length > 1) {
                lastName = String.join(" ", List.of(parts).subList(1, parts.length));
            }
        }
        if (fullName.isEmpty()) {
            throw BusinessException.badRequest("Le nom complet est obligatoire.");
        }

        user.setFullName(fullName);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmployeeId(Identifiers.blankToNull(command.employeeId()));
        user.setDepartment(Identifiers.blankToNull(command.department()));
        user.setJobTitle(Identifiers.blankToNull(command.jobTitle()));
        user.setPhoneNumber(Identifiers.blankToNull(command.phoneNumber()));
        user.setManagerId(Identifiers.blankToNull(command.managerId()));
        user.setLocale(defaultIfBlank(command.locale(), "fr-FR"));
        user.setTimezone(defaultIfBlank(command.timezone(), "Africa/Dakar"));
    }

    /** Le rôle principal est placé en tête de la liste, sans doublon. */
    private List<String> normalizeRoles(String role, List<String> roles) {
        Set<String> normalized = new LinkedHashSet<>();
        String primary = Identifiers.normalize(role);
        if (!primary.isEmpty()) {
            normalized.add(primary);
        }
        if (roles != null) {
            roles.stream().map(Identifiers::normalize).filter(code -> !code.isEmpty()).forEach(normalized::add);
        }
        if (normalized.isEmpty()) {
            throw BusinessException.badRequest("Au moins un rôle est obligatoire.");
        }

        Set<String> knownRoles = roleGateway.findAll().stream().map(Role::code).collect(Collectors.toSet());
        if (!knownRoles.containsAll(normalized)) {
            throw BusinessException.badRequest("Un ou plusieurs rôles ne sont pas connus du backend.");
        }
        return new ArrayList<>(normalized);
    }

    private String requireUniqueEmail(String rawEmail, String excludedUserId) {
        String email = Identifiers.lower(rawEmail);
        if (email.isEmpty()) {
            throw BusinessException.badRequest("L'email est obligatoire.");
        }
        if (userGateway.existsByEmailIgnoreCase(email, excludedUserId)) {
            throw BusinessException.conflict("Cet email existe déjà.");
        }
        return email;
    }

    private void validateManager(String managerId, String excludedUserId) {
        String normalized = Identifiers.blankToNull(managerId);
        if (normalized != null && !normalized.equals(excludedUserId) && userGateway.findById(normalized).isEmpty()) {
            throw BusinessException.badRequest("Le manager sélectionné est introuvable.");
        }
    }

    private static UserStatus parseStatus(String status) {
        try {
            return UserStatus.fromCode(status);
        } catch (IllegalArgumentException exception) {
            throw BusinessException.badRequest("Statut utilisateur invalide.");
        }
    }

    private static String defaultIfBlank(String value, String fallback) {
        String normalized = Identifiers.normalize(value);
        return normalized.isEmpty() ? fallback : normalized;
    }
}
