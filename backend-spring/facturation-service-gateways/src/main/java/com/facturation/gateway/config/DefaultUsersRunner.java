package com.facturation.gateway.config;

import com.facturation.core.service.DefaultUsersInitializer;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Crée les comptes par défaut au premier démarrage (à désactiver en production). */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.security.seed-default-users", havingValue = "true")
public class DefaultUsersRunner implements ApplicationRunner {

    private final DefaultUsersInitializer initializer;

    @Override
    public void run(ApplicationArguments args) {
        initializer.seedIfEmpty();
    }
}
