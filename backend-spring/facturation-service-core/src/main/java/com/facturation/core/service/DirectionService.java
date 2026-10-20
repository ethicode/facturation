package com.facturation.core.service;

import com.facturation.core.exception.BusinessException;
import com.facturation.core.port.BudgetGateway;
import com.facturation.core.port.DirectionGateway;
import com.facturation.core.port.SupplyTicketGateway;
import com.facturation.core.util.Identifiers;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class DirectionService {

    private final DirectionGateway directionGateway;
    private final BudgetGateway budgetGateway;
    private final SupplyTicketGateway ticketGateway;

    @Transactional(readOnly = true)
    public List<String> list() {
        return directionGateway.findAll();
    }

    public List<String> create(String name) {
        String normalized = Identifiers.normalize(name);
        if (normalized.isEmpty()) {
            throw BusinessException.badRequest("Le nom de la direction est obligatoire.");
        }
        if (find(normalized).isPresent()) {
            throw BusinessException.conflict("Cette direction existe déjà.");
        }
        directionGateway.create(normalized);
        return list();
    }

    public List<String> update(String currentName, String nextName) {
        String current = Identifiers.normalize(currentName);
        String next = Identifiers.normalize(nextName);
        if (current.isEmpty() || next.isEmpty()) {
            throw BusinessException.badRequest("Le nom de direction est obligatoire.");
        }
        String existing = find(current).orElseThrow(() -> BusinessException.notFound("Direction introuvable."));
        if (!current.equalsIgnoreCase(next) && find(next).isPresent()) {
            throw BusinessException.conflict("Une direction avec ce nom existe déjà.");
        }
        if (!existing.equals(next)) {
            directionGateway.rename(existing, next);
        }
        return list();
    }

    public List<String> delete(String name) {
        String normalized = Identifiers.normalize(name);
        if (normalized.isEmpty()) {
            throw BusinessException.badRequest("Le nom de direction est obligatoire.");
        }
        String existing = find(normalized).orElseThrow(() -> BusinessException.notFound("Direction introuvable."));
        if (budgetGateway.existsBudgetForDirectionIgnoreCase(existing)) {
            throw BusinessException.badRequest("Supprimez d'abord le budget lié à cette direction.");
        }
        if (ticketGateway.existsByDirectionIgnoreCase(existing)) {
            throw BusinessException.badRequest("Supprimez d'abord les tickets liés à cette direction.");
        }
        directionGateway.delete(existing);
        return list();
    }

    private Optional<String> find(String name) {
        return directionGateway.findAll().stream().filter(item -> item.equalsIgnoreCase(name)).findFirst();
    }
}
