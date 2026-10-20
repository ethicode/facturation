package com.facturation;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;

// L'authentification passe par le jeton JWT : pas d'utilisateur en mémoire généré par Spring Security.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class ServiceFacturation {

    private static final String SQLITE_PREFIX = "jdbc:sqlite:";

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(ServiceFacturation.class);
        application.addListeners(sqliteDirectoryCreator());
        application.run(args);
    }

    /** sqlite-jdbc crée le fichier de base mais pas son répertoire parent. */
    private static ApplicationListener<ApplicationEnvironmentPreparedEvent> sqliteDirectoryCreator() {
        return event -> {
            String url = event.getEnvironment().getProperty("spring.datasource.url", "");
            if (!url.startsWith(SQLITE_PREFIX)) {
                return;
            }
            String file = url.substring(SQLITE_PREFIX.length()).split("\\?", 2)[0];
            Path parent = Paths.get(file).toAbsolutePath().getParent();
            try {
                Files.createDirectories(parent);
            } catch (IOException exception) {
                throw new UncheckedIOException(exception);
            }
        };
    }
}
