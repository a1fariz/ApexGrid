package com.apexgrid.userservice.controller;

import com.apexgrid.userservice.dto.MessageResponse;
import com.apexgrid.userservice.dto.UpdateProfileRequest;
import com.apexgrid.userservice.dto.UserAdminResponse;
import com.apexgrid.userservice.security.UserDetailsImpl;
import com.apexgrid.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Open to any authenticated user
    @PutMapping("/profile")
    public ResponseEntity<MessageResponse> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(userDetails.getId(), request));
    }

    // Admin only endpoints
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserAdminResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> toggleUserStatus(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.toggleUserStatus(id));
    }
}
