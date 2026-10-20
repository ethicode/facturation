package com.facturation.core.service;

import com.facturation.core.model.User;
import com.facturation.core.model.UserStatus;
import com.facturation.core.port.PasswordHasher;
import com.facturation.core.port.UserGateway;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Crée les comptes de démonstration du backend Python lorsque la base ne contient aucun utilisateur. */
@Service
@RequiredArgsConstructor
public class DefaultUsersInitializer {

    private record SeedUser(String id, String username, String fullName, String email, String role, String password) {
    }

    private static final List<SeedUser> SEED_USERS = List.of(
            new SeedUser("USR-001", "admin", "Administrateur principal", "admin@sgsn.fr", "administrateur", "admin123"),
            new SeedUser("USR-002", "comptable", "Comptable principal", "comptable@sgsn.fr", "utilisateur", "comptable123"),
            new SeedUser("USR-003", "lad1", "Valideur LAD 1", "lad1@sgsn.fr", "utilisateur", "lad1123"),
            new SeedUser("USR-004", "lad2", "Valideur LAD 2", "lad2@sgsn.fr", "utilisateur", "lad2123"),
            new SeedUser("USR-005", "lad3", "Valideur LAD 3", "lad3@sgsn.fr", "manageur", "lad3123"),
            new SeedUser("USR-006", "tresorerie", "Responsable trésorerie", "tresorerie@sgsn.fr", "manageur", "tresorerie123"),
            new SeedUser("USR-007", "dirfin", "Direction Financière", "dirfin@sgsn.fr", "manageur", "dirfin123"));

    private final UserGateway userGateway;
    private final PasswordHasher passwordHasher;

    @Transactional
    public void seedIfEmpty() {
        if (userGateway.count() > 0) {
            return;
        }
        Instant now = Instant.now();
        for (SeedUser seed : SEED_USERS) {
            String[] names = seed.fullName().split(" ", 2);
            userGateway.save(User.builder()
                    .id(seed.id())
                    .username(seed.username())
                    .fullName(seed.fullName())
                    .firstName(names[0])
                    .lastName(names.length > 1 ? names[1] : null)
                    .email(seed.email())
                    .role(seed.role())
                    .roles(new ArrayList<>(List.of(seed.role())))
                    .passwordHash(passwordHasher.hash(seed.password()))
                    .active(true)
                    .status(UserStatus.ACTIVE)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
        }
    }
}
