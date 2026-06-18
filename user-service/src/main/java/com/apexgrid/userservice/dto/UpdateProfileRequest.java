package com.apexgrid.userservice.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    @Pattern(regexp = "^[\\p{L}\\s'.-]*$", message = "Full name contains invalid characters")
    private String fullName;

    // B-08 Fix: current password required to authorize changing the password
    private String currentPassword;

    @Size(min = 6, max = 100, message = "New password must be between 6 and 100 characters")
    private String password;
}
