package com.facturation.core.port;

import com.facturation.core.model.UploadedFile;

public interface FileStorageGateway {

    /** Stocke le fichier et renvoie la référence {@code nom::/uploads/fichier-stocke}. */
    String store(UploadedFile file);
}
