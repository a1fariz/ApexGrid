package com.apexgrid.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Username or email is required")
    @Size(max = 100, message = "Username or email must not exceed 100 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(max = 100, message = "Password must not exceed 100 characters")
    private String password;
}
