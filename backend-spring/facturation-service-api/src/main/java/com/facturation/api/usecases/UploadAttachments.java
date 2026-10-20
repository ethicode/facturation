package com.facturation.api.usecases;

import com.facturation.api.model.RequestContext;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface UploadAttachments {

    /** Renvoie les références {@code nom::/uploads/fichier-stocke}. */
    List<String> uploadAttachments(List<MultipartFile> files, RequestContext ctx);
}
