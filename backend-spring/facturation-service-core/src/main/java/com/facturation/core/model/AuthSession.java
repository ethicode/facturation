package com.facturation.core.model;

public record AuthSession(String accessToken, User user) {
}
