package com.apexgrid.userservice.controller;

import com.apexgrid.userservice.dto.*;
import com.apexgrid.userservice.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        MessageResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        JwtResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@RequestHeader("Authorization") String token) {
        UserResponse response = authService.getCurrentUser(token);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<MessageResponse> verifyEmail(@RequestParam("token") String token) {
        MessageResponse response = authService.verifyEmail(token);
        return ResponseEntity.ok(response);
    }

    // Missing feature fix: resend verification email when token expired or not received
    @PostMapping("/resend-verification")
    public ResponseEntity<MessageResponse> resendVerification(@RequestParam("email") String email) {
        MessageResponse response = authService.resendVerification(email);
        return ResponseEntity.ok(response);
    }

    // Missing feature fix: forgot password — sends reset link to email
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        MessageResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    // Missing feature fix: reset password using token from email
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        MessageResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<MessageResponse> health() {
        return ResponseEntity.ok(new MessageResponse("User service is up"));
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(@RequestHeader("Authorization") String token) {
        MessageResponse response = authService.logout(token);
        return ResponseEntity.ok(response);
    }
}
