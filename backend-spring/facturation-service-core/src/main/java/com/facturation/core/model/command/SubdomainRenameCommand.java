package com.facturation.core.model.command;

public record SubdomainRenameCommand(String domain, String currentName, String nextName) {
}
