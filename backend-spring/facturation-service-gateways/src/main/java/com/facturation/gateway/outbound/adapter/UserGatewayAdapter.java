package com.facturation.gateway.outbound.adapter;

import com.facturation.core.model.User;
import com.facturation.core.model.UserStatus;
import com.facturation.core.port.UserGateway;
import com.facturation.gateway.outbound.entity.UserEntity;
import com.facturation.gateway.outbound.repository.UserRepository;
import com.facturation.gateway.outbound.repository.WorkflowAssignmentRepository;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserGatewayAdapter implements UserGateway {

    private final UserRepository repository;
    private final WorkflowAssignmentRepository assignmentRepository;

    @Override
    public List<User> findAll() {
        return repository.findAllByOrderByPositionAsc().stream().map(UserGatewayAdapter::toDomain).toList();
    }

    @Override
    public Optional<User> findById(String id) {
        return id == null ? Optional.empty() : repository.findById(id).map(UserGatewayAdapter::toDomain);
    }

    @Override
    public Optional<User> findByUsernameIgnoreCase(String username) {
        return repository.findByUsernameIgnoreCase(username).map(UserGatewayAdapter::toDomain);
    }

    @Override
    public boolean existsByEmailIgnoreCase(String email, String excludedUserId) {
        return repository.existsByEmailIgnoreCaseExcluding(email, excludedUserId);
    }

    @Override
    public List<String> findAllIds() {
        return repository.findAllIds();
    }

    @Override
    public long count() {
        return repository.count();
    }

    @Override
    public User save(User user) {
        UserEntity entity = repository.findById(user.getId()).orElseGet(() -> {
            UserEntity created = new UserEntity();
            created.setId(user.getId());
            created.setPosition(repository.findMinPosition() - 1);
            return created;
        });

        entity.setUsername(user.getUsername());
        entity.setFullName(user.getFullName());
        entity.setFirstName(user.getFirstName());
        entity.setLastName(user.getLastName());
        entity.setEmail(user.getEmail());
        entity.setEmployeeId(user.getEmployeeId());
        entity.setDepartment(user.getDepartment());
        entity.setJobTitle(user.getJobTitle());
        entity.setPhoneNumber(user.getPhoneNumber());
        entity.setManagerId(user.getManagerId());
        entity.setLocale(user.getLocale());
        entity.setTimezone(user.getTimezone());
        entity.setRole(user.getRole());
        LinkedHashSet<String> roles = new LinkedHashSet<>(user.getRoles());
        if (!entity.getRoles().equals(roles)) {
            entity.getRoles().clear();
            entity.getRoles().addAll(roles);
        }
        entity.setPasswordHash(user.getPasswordHash());
        entity.setActive(user.isActive());
        entity.setStatus(user.getStatus().code());
        entity.setCreatedAt(user.getCreatedAt());
        entity.setUpdatedAt(user.getUpdatedAt());
        entity.setLastLoginAt(user.getLastLoginAt());

        return toDomain(repository.saveAndFlush(entity));
    }

    @Override
    public void deleteById(String id) {
        assignmentRepository.deleteByUserId(id);
        repository.deleteById(id);
        repository.flush();
    }

    private static User toDomain(UserEntity entity) {
        // Le rôle principal est toujours renvoyé en premier.
        List<String> roles = new ArrayList<>();
        roles.add(entity.getRole());
        entity.getRoles().stream().filter(role -> !role.equals(entity.getRole())).forEach(roles::add);

        return User.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .fullName(entity.getFullName())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .email(entity.getEmail())
                .employeeId(entity.getEmployeeId())
                .department(entity.getDepartment())
                .jobTitle(entity.getJobTitle())
                .phoneNumber(entity.getPhoneNumber())
                .managerId(entity.getManagerId())
                .locale(entity.getLocale())
                .timezone(entity.getTimezone())
                .role(entity.getRole())
                .roles(roles)
                .passwordHash(entity.getPasswordHash())
                .active(entity.isActive())
                .status(UserStatus.fromCode(entity.getStatus()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .lastLoginAt(entity.getLastLoginAt())
                .build();
    }
}
