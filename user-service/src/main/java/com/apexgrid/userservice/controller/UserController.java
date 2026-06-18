package com.apexgrid.userservice.controller;

import com.apexgrid.userservice.dto.MessageResponse;
import com.apexgrid.userservice.dto.UpdateProfileRequest;
import com.apexgrid.userservice.dto.UserAdminResponse;
import com.apexgrid.userservice.security.UserDetailsImpl;
import com.apexgrid.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Open to any authenticated user
    @PutMapping("/profile")
    public ResponseEntity<MessageResponse> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(userDetails.getId(), request));
    }

    // Admin only endpoints
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserAdminResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(userService.getAllUsers(page, size, search));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> toggleUserStatus(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(userService.toggleUserStatus(id));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserAdminResponse> getUserById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> adminResetUserPassword(
            @PathVariable("id") Integer id,
            @RequestBody java.util.Map<String, String> request) {
        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new com.apexgrid.userservice.exception.ApiException("New password cannot be blank", org.springframework.http.HttpStatus.BAD_REQUEST);
        }
        if (newPassword.length() < 6) {
            throw new com.apexgrid.userservice.exception.ApiException("New password must be at least 6 characters", org.springframework.http.HttpStatus.BAD_REQUEST);
        }
        return ResponseEntity.ok(userService.adminResetUserPassword(id, newPassword));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> adminAssignRole(
            @PathVariable("id") Integer id,
            @RequestBody java.util.Map<String, String> request) {
        String newRole = request.get("newRole");
        if (newRole == null || newRole.trim().isEmpty()) {
            throw new com.apexgrid.userservice.exception.ApiException("Role cannot be blank", org.springframework.http.HttpStatus.BAD_REQUEST);
        }
        return ResponseEntity.ok(userService.adminAssignRole(id, newRole));
    }
}
