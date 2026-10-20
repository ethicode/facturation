package com.facturation.gateway.outbound.entity.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;

/**
 * Stocke les horodatages au format ISO-8601 (texte), comme le backend Python, afin que SQLite
 * conserve des valeurs lisibles et triables. À retirer si la base cible gère nativement les timestamps.
 */
@Converter(autoApply = true)
public class InstantIsoConverter implements AttributeConverter<Instant, String> {

    @Override
    public String convertToDatabaseColumn(Instant value) {
        return value == null ? null : value.toString();
    }

    @Override
    public Instant convertToEntityAttribute(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException exception) {
            return OffsetDateTime.parse(value).toInstant();
        }
    }
}
