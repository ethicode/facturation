package com.facturation.core.model;

/** Fichier reçu par l'API, à stocker par la gateway. */
public record UploadedFile(String originalName, byte[] content) {
}
