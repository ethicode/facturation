package com.facturation.gateway.outbound.adapter;

import com.facturation.core.model.UploadedFile;
import com.facturation.core.port.FileStorageGateway;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Stockage des pièces jointes sur disque, exposées ensuite sous /uploads. */
@Component
public class LocalFileStorageAdapter implements FileStorageGateway {

    private static final Pattern UNSAFE_CHARACTERS = Pattern.compile("[^A-Za-z0-9._-]");

    private final Path uploadsDir;

    public LocalFileStorageAdapter(@Value("${app.storage.uploads-dir}") String uploadsDir) {
        this.uploadsDir = Paths.get(uploadsDir).toAbsolutePath().normalize();
    }

    @Override
    public String store(UploadedFile file) {
        String safeName = sanitize(file.originalName());
        String storedName = UUID.randomUUID().toString().replace("-", "") + "_" + safeName;
        Path target = uploadsDir.resolve(storedName).normalize();
        if (!target.startsWith(uploadsDir)) {
            throw new IllegalStateException("Chemin de stockage invalide.");
        }
        try {
            Files.createDirectories(uploadsDir);
            Files.write(target, file.content());
        } catch (IOException exception) {
            throw new UncheckedIOException("Impossible d'enregistrer la pièce jointe.", exception);
        }
        return safeName + "::/uploads/" + storedName;
    }

    static String sanitize(String filename) {
        String name = filename == null || filename.isBlank() ? "file" : Paths.get(filename).getFileName().toString();
        String normalized = UNSAFE_CHARACTERS.matcher(name).replaceAll("_").replaceAll("^[._]+|[._]+$", "");
        return normalized.isEmpty() ? "file" : normalized;
    }
}
