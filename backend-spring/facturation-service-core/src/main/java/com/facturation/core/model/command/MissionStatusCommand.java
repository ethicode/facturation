package com.facturation.core.model.command;

public record MissionStatusCommand(String nextStatus, String expectedStatus) {
}
