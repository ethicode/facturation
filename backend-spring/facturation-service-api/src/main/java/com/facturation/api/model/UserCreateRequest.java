package com.facturation.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UserCreateRequest(
        @NotNull String username,
        @NotNull String password,
        @NotNull @JsonProperty("full_name") String fullName,
        @JsonProperty("first_name") String firstName,
        @JsonProperty("last_name") String lastName,
        @JsonProperty("employee_id") String employeeId,
        String department,
        @JsonProperty("job_title") String jobTitle,
        @JsonProperty("phone_number") String phoneNumber,
        @JsonProperty("manager_id") String managerId,
        String locale,
        String timezone,
        @NotNull String role,
        List<String> roles,
        @NotNull String email) {
}
