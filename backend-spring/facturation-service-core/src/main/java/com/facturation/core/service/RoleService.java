package com.facturation.core.service;

import com.facturation.core.exception.BusinessException;
import com.facturation.core.model.Role;
import com.facturation.core.model.User;
import com.facturation.core.port.RoleGateway;
import com.facturation.core.port.UserGateway;
import com.facturation.core.util.Identifiers;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleService {

    static final String FALLBACK_ROLE = "administrateur";
    private static final Set<String> PROTECTED_ROLES = Set.of("admin", "administrateur");

    private final RoleGateway roleGateway;
    private final UserGateway userGateway;

    @Transactional(readOnly = true)
    public List<Role> list() {
        return roleGateway.findAll();
    }

    public List<Role> create(String code, String label) {
        String normalizedCode = Identifiers.lower(code);
        String normalizedLabel = Identifiers.normalize(label);
        if (normalizedCode.isEmpty() || normalizedLabel.isEmpty()) {
            throw BusinessException.badRequest("Le code et le libellé du rôle sont obligatoires.");
        }
        if (roleGateway.existsByCode(normalizedCode)) {
            throw BusinessException.conflict("Ce rôle existe déjà.");
        }
        roleGateway.save(new Role(normalizedCode, normalizedLabel));
        return list();
    }

    public List<Role> update(String code, String label) {
        String normalizedCode = Identifiers.lower(code);
        if (!roleGateway.existsByCode(normalizedCode)) {
            throw BusinessException.notFound("Rôle introuvable.");
        }
        String normalizedLabel = Identifiers.normalize(label);
        if (normalizedLabel.isEmpty()) {
            throw BusinessException.badRequest("Le libellé du rôle est obligatoire.");
        }
        roleGateway.save(new Role(normalizedCode, normalizedLabel));
        return list();
    }

    /** Supprime le rôle et le retire des utilisateurs ; un utilisateur sans rôle restant redevient administrateur. */
    public List<Role> delete(String code) {
        String normalizedCode = Identifiers.lower(code);
        if (!roleGateway.existsByCode(normalizedCode)) {
            throw BusinessException.notFound("Rôle introuvable.");
        }
        if (PROTECTED_ROLES.contains(normalizedCode)) {
            throw BusinessException.badRequest("Ce rôle ne peut pas être supprimé.");
        }

        for (User user : userGateway.findAll()) {
            if (!user.getRoles().contains(normalizedCode) && !normalizedCode.equals(user.getRole())) {
                continue;
            }
            List<String> remaining = new ArrayList<>(user.getRoles().stream()
                    .filter(role -> !role.equals(normalizedCode))
                    .toList());
            if (remaining.isEmpty()) {
                remaining.add(FALLBACK_ROLE);
            }
            user.setRole(remaining.get(0));
            user.setRoles(remaining);
            userGateway.save(user);
        }
        roleGateway.deleteByCode(normalizedCode);
        return list();
    }
}
