package com.facturation.gateway.outbound.adapter;

import com.facturation.core.model.ApproDomain;
import com.facturation.core.port.ApproDomainGateway;
import com.facturation.gateway.outbound.entity.ApproDomainEntity;
import com.facturation.gateway.outbound.entity.ApproSubdomainEntity;
import com.facturation.gateway.outbound.repository.ApproDomainRepository;
import com.facturation.gateway.outbound.repository.ApproSubdomainRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ApproDomainGatewayAdapter implements ApproDomainGateway {

    private final ApproDomainRepository domainRepository;
    private final ApproSubdomainRepository subdomainRepository;

    @Override
    public List<ApproDomain> findAll() {
        Map<String, List<String>> catalog = new LinkedHashMap<>();
        domainRepository.findAllByOrderByPositionAsc().forEach(domain -> catalog.put(domain.getName(), new ArrayList<>()));
        subdomainRepository.findAllOrdered().forEach(sub ->
                catalog.computeIfAbsent(sub.getId().getDomainName(), key -> new ArrayList<>()).add(sub.getId().getName()));
        return catalog.entrySet().stream()
                .map(entry -> new ApproDomain(entry.getKey(), List.copyOf(entry.getValue())))
                .toList();
    }

    @Override
    public void createDomain(String name) {
        ApproDomainEntity entity = new ApproDomainEntity();
        entity.setName(name);
        entity.setPosition(domainRepository.findMaxPosition() + 1);
        domainRepository.saveAndFlush(entity);
    }

    @Override
    public void deleteDomain(String name) {
        subdomainRepository.deleteByDomain(name);
        domainRepository.deleteById(name);
        domainRepository.flush();
    }

    @Override
    public void addSubdomain(String domain, String name) {
        ApproSubdomainEntity entity = new ApproSubdomainEntity();
        entity.setId(new ApproSubdomainEntity.Key(domain, name));
        entity.setPosition(subdomainRepository.findMaxPosition(domain) + 1);
        subdomainRepository.saveAndFlush(entity);
    }

    @Override
    public void renameSubdomain(String domain, String currentName, String nextName) {
        ApproSubdomainEntity.Key currentKey = new ApproSubdomainEntity.Key(domain, currentName);
        int position = subdomainRepository.findById(currentKey).map(ApproSubdomainEntity::getPosition).orElse(0);
        subdomainRepository.deleteById(currentKey);
        subdomainRepository.flush();

        ApproSubdomainEntity renamed = new ApproSubdomainEntity();
        renamed.setId(new ApproSubdomainEntity.Key(domain, nextName));
        renamed.setPosition(position);
        subdomainRepository.saveAndFlush(renamed);
    }

    @Override
    public void deleteSubdomain(String domain, String name) {
        subdomainRepository.deleteById(new ApproSubdomainEntity.Key(domain, name));
        subdomainRepository.flush();
    }
}
