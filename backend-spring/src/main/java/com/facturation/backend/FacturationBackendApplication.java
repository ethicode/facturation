package com.facturation.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootApplication
public class FacturationBackendApplication {
    public static void main(String[] args) throws Exception {
        // SQLite does not create missing parent directories, so ensure they exist before the datasource connects.
        Files.createDirectories(Path.of("../data/uploads"));
        SpringApplication.run(FacturationBackendApplication.class, args);
    }
}
