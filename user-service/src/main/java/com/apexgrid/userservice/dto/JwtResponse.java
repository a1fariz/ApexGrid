package com.apexgrid.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {

    private String token;
    private String type;
    private String refreshToken;
    private Integer id;
    private String username;
    private String email;
    private String role;
    private String fullName;

    public JwtResponse(String token, String refreshToken, Integer id, String username, String email, String role, String fullName) {
        this.token = token;
        this.type = "Bearer";
        this.refreshToken = refreshToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.fullName = fullName;
    }
}
