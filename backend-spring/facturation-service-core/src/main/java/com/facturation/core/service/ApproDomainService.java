package com.facturation.core.service;

import com.facturation.core.exception.BusinessException;
import com.facturation.core.model.ApproDomain;
import com.facturation.core.model.command.SubdomainRenameCommand;
import com.facturation.core.port.ApproDomainGateway;
import com.facturation.core.port.SupplyTicketGateway;
import com.facturation.core.util.Identifiers;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Référentiel des domaines et sous-domaines d'approvisionnement. */
@Service
@RequiredArgsConstructor
@Transactional
public class ApproDomainService {

    private final ApproDomainGateway domainGateway;
    private final SupplyTicketGateway ticketGateway;

    @Transactional(readOnly = true)
    public List<ApproDomain> catalog() {
        return domainGateway.findAll();
    }

    public List<ApproDomain> createDomain(String name) {
        String normalized = Identifiers.normalize(name);
        if (normalized.isEmpty()) {
            throw BusinessException.badRequest("Le domaine est obligatoire.");
        }
        if (findDomain(normalized).isPresent()) {
            throw BusinessException.conflict("Ce domaine existe déjà.");
        }
        domainGateway.createDomain(normalized);
        return catalog();
    }

    public List<ApproDomain> deleteDomain(String name) {
        String normalized = Identifiers.normalize(name);
        if (normalized.isEmpty()) {
            throw BusinessException.badRequest("Le domaine est obligatoire.");
        }
        ApproDomain domain = requireDomain(normalized);
        if (ticketGateway.existsByDomainIgnoreCase(domain.name())) {
            throw BusinessException.badRequest("Supprimez d'abord les tickets liés à ce domaine.");
        }
        domainGateway.deleteDomain(domain.name());
        return catalog();
    }

    public List<ApproDomain> createSubdomain(String domainName, String name) {
        String normalizedDomain = Identifiers.normalize(domainName);
        String normalizedName = Identifiers.normalize(name);
        if (normalizedDomain.isEmpty() || normalizedName.isEmpty()) {
            throw BusinessException.badRequest("Le domaine et le sous-domaine sont obligatoires.");
        }
        ApproDomain domain = requireDomain(normalizedDomain);
        if (findSubdomain(domain, normalizedName).isPresent()) {
            throw BusinessException.conflict("Ce sous-domaine existe déjà pour ce domaine.");
        }
        domainGateway.addSubdomain(domain.name(), normalizedName);
        return catalog();
    }

    public List<ApproDomain> renameSubdomain(SubdomainRenameCommand command) {
        String domainName = Identifiers.normalize(command.domain());
        String currentName = Identifiers.normalize(command.currentName());
        String nextName = Identifiers.normalize(command.nextName());
        if (domainName.isEmpty() || currentName.isEmpty() || nextName.isEmpty()) {
            throw BusinessException.badRequest("Le domaine et les noms de sous-domaine sont obligatoires.");
        }
        ApproDomain domain = requireDomain(domainName);
        String existing = findSubdomain(domain, currentName)
                .orElseThrow(() -> BusinessException.notFound("Sous-domaine introuvable."));
        if (!currentName.equalsIgnoreCase(nextName) && findSubdomain(domain, nextName).isPresent()) {
            throw BusinessException.conflict("Un sous-domaine avec ce nom existe déjà.");
        }
        if (!existing.equals(nextName)) {
            domainGateway.renameSubdomain(domain.name(), existing, nextName);
            ticketGateway.renameSubdomain(domain.name(), existing, nextName);
        }
        return catalog();
    }

    public List<ApproDomain> deleteSubdomain(String domainName, String name) {
        String normalizedDomain = Identifiers.normalize(domainName);
        String normalizedName = Identifiers.normalize(name);
        if (normalizedDomain.isEmpty() || normalizedName.isEmpty()) {
            throw BusinessException.badRequest("Le domaine et le sous-domaine sont obligatoires.");
        }
        ApproDomain domain = requireDomain(normalizedDomain);
        String existing = findSubdomain(domain, normalizedName)
                .orElseThrow(() -> BusinessException.notFound("Sous-domaine introuvable."));
        if (ticketGateway.existsByDomainAndSubdomainIgnoreCase(domain.name(), existing)) {
            throw BusinessException.badRequest("Supprimez d'abord les tickets liés à ce sous-domaine.");
        }
        domainGateway.deleteSubdomain(domain.name(), existing);
        return catalog();
    }

    private ApproDomain requireDomain(String name) {
        return findDomain(name).orElseThrow(() -> BusinessException.notFound("Domaine introuvable."));
    }

    private Optional<ApproDomain> findDomain(String name) {
        return domainGateway.findAll().stream().filter(domain -> domain.name().equalsIgnoreCase(name)).findFirst();
    }

    private static Optional<String> findSubdomain(ApproDomain domain, String name) {
        return domain.subdomains().stream().filter(sub -> sub.equalsIgnoreCase(name)).findFirst();
    }
}
