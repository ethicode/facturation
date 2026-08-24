package com.facturation.api.config;

import com.facturation.core.gateway.AppStateGateway;
import com.facturation.core.service.BackendService;
import com.facturation.core.service.TokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AppBeansConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public TokenService tokenService(@Value("${app.auth.secret:dev-secret-change-me}") String secret) {
        return new TokenService(secret);
    }

    @Bean
    public BackendService backendService(AppStateGateway appStateGateway, PasswordEncoder passwordEncoder, TokenService tokenService) {
        return new BackendService(appStateGateway, passwordEncoder, tokenService);
    }
}
