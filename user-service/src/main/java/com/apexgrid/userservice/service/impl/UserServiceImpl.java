package com.apexgrid.userservice.service.impl;

import com.apexgrid.userservice.dto.MessageResponse;
import com.apexgrid.userservice.dto.UpdateProfileRequest;
import com.apexgrid.userservice.dto.UserAdminResponse;
import com.apexgrid.userservice.entity.User;
import com.apexgrid.userservice.exception.ApiException;
import com.apexgrid.userservice.repository.UserRepository;
import com.apexgrid.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public MessageResponse updateProfile(Integer userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(user);
        return new MessageResponse("Profile updated successfully");
    }

    @Override
    public List<UserAdminResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> UserAdminResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(user.getRole().getName())
                        .isActive(user.getIsActive())
                        .isVerified(user.getIsVerified())
                        .createdAt(user.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MessageResponse toggleUserStatus(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        if (user.getRole().getName().equals("ADMIN")) {
            throw new ApiException("Cannot toggle status of an ADMIN", HttpStatus.FORBIDDEN);
        }

        user.setIsActive(!user.getIsActive());
        userRepository.save(user);

        String status = user.getIsActive() ? "activated" : "suspended";
        return new MessageResponse("User has been " + status);
    }
}
