package com.facturation.core.util;

import java.time.Instant;
import java.time.Year;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

public final class Identifiers {

    private Identifiers() {
    }

    public static String eventId() {
        return Instant.now().toEpochMilli() + "-" + ThreadLocalRandom.current().nextInt(1000, 10000);
    }

    /** Génère PREFIX-ANNEE-NNN à partir de la plus grande séquence existante pour l'année courante. */
    public static String yearlyReference(String prefix, Collection<String> existingIds) {
        String yearPrefix = prefix + "-" + Year.now(ZoneOffset.UTC).getValue() + "-";
        return yearPrefix + String.format("%03d", maxSequence(yearPrefix, existingIds) + 1);
    }

    public static String sequentialReference(String prefix, Collection<String> existingIds) {
        return prefix + String.format("%03d", maxSequence(prefix, existingIds) + 1);
    }

    public static String missionCode(Collection<String> existingCodes) {
        int counter = existingCodes.size() + 1;
        while (true) {
            String candidate = String.format("MS-%04d", counter);
            if (!existingCodes.contains(candidate)) {
                return candidate;
            }
            counter++;
        }
    }

    public static String normalize(String value) {
        return value == null ? "" : value.strip();
    }

    public static String lower(String value) {
        return normalize(value).toLowerCase(Locale.ROOT);
    }

    public static String blankToNull(String value) {
        String normalized = normalize(value);
        return normalized.isEmpty() ? null : normalized;
    }

    private static int maxSequence(String prefix, Collection<String> existingIds) {
        int max = 0;
        for (String id : existingIds) {
            if (id == null || !id.startsWith(prefix)) {
                continue;
            }
            String suffix = id.substring(prefix.length());
            if (!suffix.isEmpty() && suffix.chars().allMatch(Character::isDigit)) {
                max = Math.max(max, Integer.parseInt(suffix));
            }
        }
        return max;
    }
}
