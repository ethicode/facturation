package com.facturation.backend.controller;

import com.facturation.backend.service.AppService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
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
public class UploadController extends BaseController {
    @Value("${app.uploads-dir:../data/uploads}")
    private String uploadsDir;

    public UploadController(AppService appService) {
        super(appService);
    }

    @PostMapping("/uploads")
    public List<String> upload(@RequestPart("files") List<MultipartFile> files,
                               @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireUser(authorization);

        try {
            Path dir = Path.of(uploadsDir);
            Files.createDirectories(dir);

            List<String> refs = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) {
                    continue;
                }
                String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
                String safeOriginal = original.replaceAll("[^A-Za-z0-9._-]", "_");
                String stored = UUID.randomUUID().toString().replace("-", "") + "_" + safeOriginal;
                Files.copy(file.getInputStream(), dir.resolve(stored), StandardCopyOption.REPLACE_EXISTING);
                refs.add(safeOriginal + "::/uploads/" + stored);
            }
            return refs;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Impossible de televerser les fichiers");
        }
    }
}
