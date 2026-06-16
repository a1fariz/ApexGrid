package com.apexgrid.userservice.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String password;
}
