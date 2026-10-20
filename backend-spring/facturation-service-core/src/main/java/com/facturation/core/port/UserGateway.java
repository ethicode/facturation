package com.facturation.core.port;

import com.facturation.core.model.User;
import java.util.List;
import java.util.Optional;

public interface UserGateway {

    List<User> findAll();

    Optional<User> findById(String id);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email, String excludedUserId);

    List<String> findAllIds();

    long count();

    User save(User user);

    /** Supprime l'utilisateur ainsi que ses affectations de workflow. */
    void deleteById(String id);
}
