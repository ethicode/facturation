package com.facturation.api.controller;

import com.facturation.core.service.BackendService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@Tag(name = "Factures")
public class UploadController extends BaseSecuredController {
    @Value("${app.uploads-dir:uploads}")
    private String uploadsDir;

    public UploadController(BackendService backendService) {
        super(backendService);
    }

    @PostMapping("/uploads")
    public List<String> upload(@RequestPart("files") List<MultipartFile> files,
                               @RequestHeader(name = "Authorization", required = false) String authorization) {
        requireUser(authorization);

        List<String> refs = new ArrayList<>();
        try {
            Path dir = Path.of(uploadsDir);
            Files.createDirectories(dir);

            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) {
                    continue;
                }
                String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
                String safeName = originalName.replaceAll("[^A-Za-z0-9._-]", "_");
                String storedName = UUID.randomUUID().toString().replace("-", "") + "_" + safeName;
                Path target = dir.resolve(storedName);
                Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
                refs.add(safeName + "::/uploads/" + storedName);
            }

            return refs;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Impossible de televerser les fichiers");
        }
    }
}
