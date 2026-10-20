package com.facturation.core.service;

import com.facturation.core.model.UploadedFile;
import com.facturation.core.port.FileStorageGateway;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final FileStorageGateway fileStorageGateway;

    public List<String> store(List<UploadedFile> files) {
        return files.stream().map(fileStorageGateway::store).toList();
    }
}
