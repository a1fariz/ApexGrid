package com.apexgrid.userservice.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserAdminResponse {
    private Integer id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private Boolean isActive;
    private Boolean isVerified;
    private LocalDateTime createdAt;
}
