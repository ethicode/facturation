package com.facturation.core.usecases;

import com.facturation.api.model.RequestContext;
import com.facturation.api.usecases.UploadAttachments;
import com.facturation.core.model.UploadedFile;
import com.facturation.core.service.AttachmentService;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UploadAttachmentsImpl implements UploadAttachments {

    private final AttachmentService attachmentService;

    @Override
    public List<String> uploadAttachments(List<MultipartFile> files, RequestContext ctx) {
        return attachmentService.store(files.stream()
                .filter(Objects::nonNull)
                .map(UploadAttachmentsImpl::toUploadedFile)
                .toList());
    }

    private static UploadedFile toUploadedFile(MultipartFile file) {
        try {
            return new UploadedFile(file.getOriginalFilename(), file.getBytes());
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }
}
