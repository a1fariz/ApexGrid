package com.apexgrid.userservice.service.impl;

import com.apexgrid.userservice.dto.*;
import com.apexgrid.userservice.entity.Role;
import com.apexgrid.userservice.entity.User;
import com.apexgrid.userservice.exception.ApiException;
import com.apexgrid.userservice.repository.RoleRepository;
import com.apexgrid.userservice.repository.UserRepository;
import com.apexgrid.userservice.security.JwtUtils;
import com.apexgrid.userservice.security.UserDetailsImpl;
import com.apexgrid.userservice.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Override
    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ApiException("Username '" + request.getUsername() + "' is already taken", HttpStatus.CONFLICT);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Email '" + request.getEmail() + "' is already registered", HttpStatus.CONFLICT);
        }

        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new ApiException("Role USER not found", HttpStatus.INTERNAL_SERVER_ERROR));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(userRole)
                .isActive(true)
                .build();

        userRepository.save(user);
        log.info("User registered successfully: {}", request.getUsername());

        return new MessageResponse("User registered successfully! Please login to continue.");
    }

    @Override
    public JwtResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        String jwt = jwtUtils.generateToken(userDetails);
        log.info("User logged in successfully: {}", userDetails.getUsername());

        return new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getRole(),
                userDetails.getFullName()
        );
    }

    @Override
    public UserResponse getCurrentUser(String token) {
        // Extract token (remove "Bearer " prefix if present)
        String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;

        if (!jwtUtils.validateToken(jwt)) {
            throw new ApiException("Invalid or expired token", HttpStatus.UNAUTHORIZED);
        }

        String username = jwtUtils.extractUsername(jwt);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
