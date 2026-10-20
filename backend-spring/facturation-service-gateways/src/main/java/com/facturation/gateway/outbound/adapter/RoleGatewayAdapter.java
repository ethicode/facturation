package com.facturation.gateway.outbound.adapter;

import com.facturation.core.model.Role;
import com.facturation.core.port.RoleGateway;
import com.facturation.gateway.outbound.entity.RoleEntity;
import com.facturation.gateway.outbound.repository.RoleRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RoleGatewayAdapter implements RoleGateway {

    private final RoleRepository repository;

    @Override
    public List<Role> findAll() {
        return repository.findAllByOrderByPositionAsc().stream()
                .map(entity -> new Role(entity.getCode(), entity.getLabel()))
                .toList();
    }

    @Override
    public boolean existsByCode(String code) {
        return repository.existsById(code);
    }

    @Override
    public Role save(Role role) {
        RoleEntity entity = repository.findById(role.code()).orElseGet(() -> {
            RoleEntity created = new RoleEntity();
            created.setCode(role.code());
            created.setPosition(repository.findMaxPosition() + 1);
            return created;
        });
        entity.setLabel(role.label());
        repository.saveAndFlush(entity);
        return role;
    }

    @Override
    public void deleteByCode(String code) {
        repository.deleteById(code);
        repository.flush();
    }
}
