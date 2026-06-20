package com.apexgrid.userservice.service.impl;

import com.apexgrid.userservice.dto.*;
import com.apexgrid.userservice.entity.PasswordResetToken;
import com.apexgrid.userservice.entity.Role;
import com.apexgrid.userservice.entity.User;
import com.apexgrid.userservice.exception.ApiException;
import com.apexgrid.userservice.repository.PasswordResetTokenRepository;
import com.apexgrid.userservice.repository.RefreshTokenRepository;
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

import com.apexgrid.userservice.entity.VerificationToken;
import com.apexgrid.userservice.repository.VerificationTokenRepository;
import com.apexgrid.userservice.service.UserEmailService;

import java.util.UUID;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserEmailService userEmailService;

    @Override
    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (userRepository.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new ApiException("Username '" + request.getUsername() + "' is already taken", HttpStatus.CONFLICT);
        }

        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
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
                .isVerified(false)
                .build();

        userRepository.save(user);

        // Generate and save verification token
        String tokenStr = UUID.randomUUID().toString();
        VerificationToken token = VerificationToken.builder()
                .user(user)
                .token(tokenStr)
                .expiredAt(LocalDateTime.now().plusHours(24))
                .build();
        tokenRepository.save(token);

        // B-07 Fix: email failure is caught separately — user record is always persisted.
        // User can request resend via POST /api/auth/resend-verification
        try {
            userEmailService.sendVerificationEmail(user, token);
        } catch (Exception e) {
            log.error("Failed to send verification email during registration for {}: {}", request.getEmail(), e.getMessage());
        }

        log.info("User registered successfully: {}", request.getUsername());
        return new MessageResponse("Registration successful! Please check your email to verify your account.");
    }

    @Override
    @Transactional
    public JwtResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        if (userDetails.getIsVerified() != null && !userDetails.getIsVerified()) {
            throw new ApiException("Please verify your email first", HttpStatus.FORBIDDEN);
        }

        if (userDetails.getIsActive() != null && !userDetails.getIsActive()) {
            throw new ApiException("Your account has been suspended by an administrator", HttpStatus.FORBIDDEN);
        }

        String jwt = jwtUtils.generateToken(userDetails);
        
        // Find existing user
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        // Delete existing refresh token if any
        refreshTokenRepository.deleteByUser(user);
        refreshTokenRepository.flush();

        // Generate new Refresh Token (Valid for 7 days)
        String refreshTokenStr = UUID.randomUUID().toString();
        com.apexgrid.userservice.entity.RefreshToken refreshToken = com.apexgrid.userservice.entity.RefreshToken.builder()
                .user(user)
                .token(refreshTokenStr)
                .expiryDate(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
        refreshTokenRepository.save(refreshToken);

        log.info("User logged in successfully: {}", userDetails.getUsername());

        return new JwtResponse(
                jwt,
                refreshTokenStr,
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
        User user = userRepository.findByUsernameIgnoreCase(username)
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

    @Override
    @Transactional
    public MessageResponse verifyEmail(String tokenStr) {
        VerificationToken token = tokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new ApiException("Invalid or missing verification token", HttpStatus.BAD_REQUEST));

        if (token.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new ApiException("Verification token has expired. Please request a new verification email.", HttpStatus.BAD_REQUEST);
        }

        User user = token.getUser();
        user.setIsVerified(true);
        userRepository.save(user);

        tokenRepository.delete(token);

        log.info("User email verified successfully: {}", user.getEmail());
        return new MessageResponse("Email verified successfully! You can now log in.");
    }

    @Override
    @Transactional
    public MessageResponse resendVerification(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException("Email not found", HttpStatus.NOT_FOUND));

        if (user.getIsVerified()) {
            throw new ApiException("This email is already verified. Please log in.", HttpStatus.BAD_REQUEST);
        }

        if (!user.getIsActive()) {
            throw new ApiException("Your account has been suspended. Please contact support.", HttpStatus.FORBIDDEN);
        }

        // Delete existing tokens for this user and issue a fresh one
        tokenRepository.deleteByUser(user);

        String tokenStr = UUID.randomUUID().toString();
        VerificationToken token = VerificationToken.builder()
                .user(user)
                .token(tokenStr)
                .expiredAt(LocalDateTime.now().plusHours(24))
                .build();
        tokenRepository.save(token);

        userEmailService.sendVerificationEmail(user, token);

        log.info("Verification email resent to: {}", email);
        return new MessageResponse("A new verification email has been sent. Please check your inbox.");
    }

    @Override
    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        // Always return the same message to prevent email enumeration attacks
        userRepository.findByEmailIgnoreCase(request.getEmail()).ifPresent(user -> {
            // Remove any previously issued reset tokens for this user
            passwordResetTokenRepository.deleteByUser(user);

            String tokenStr = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .token(tokenStr)
                    .expiredAt(LocalDateTime.now().plusHours(1))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(resetToken);

            userEmailService.sendPasswordResetEmail(user, resetToken);
            log.info("Password reset token generated for: {}", request.getEmail());
        });

        return new MessageResponse("If that email is registered, you will receive a password reset link shortly.");
    }

    @Override
    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new ApiException("Invalid or expired reset token", HttpStatus.BAD_REQUEST));

        if (resetToken.getUsed()) {
            throw new ApiException("This reset link has already been used. Please request a new one.", HttpStatus.BAD_REQUEST);
        }

        if (resetToken.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new ApiException("Reset token has expired. Please request a new password reset.", HttpStatus.BAD_REQUEST);
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark token as used (keep for audit trail instead of deleting)
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password reset successfully for user: {}", user.getEmail());
        return new MessageResponse("Your password has been reset successfully. You can now log in with your new password.");
    }

    @Override
    @Transactional
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        com.apexgrid.userservice.entity.RefreshToken refreshToken = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new ApiException("Refresh token is not in database!", HttpStatus.FORBIDDEN));

        if (refreshToken.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(refreshToken);
            throw new ApiException("Refresh token was expired. Please make a new signin request", HttpStatus.FORBIDDEN);
        }

        User user = refreshToken.getUser();

        // Suspend check: if user is suspended, revoke their refresh token immediately
        // and reject the request — no new JWT will be issued.
        if (Boolean.FALSE.equals(user.getIsActive())) {
            refreshTokenRepository.delete(refreshToken);
            throw new ApiException("Your account has been suspended by an administrator", HttpStatus.FORBIDDEN);
        }

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);

        String token = jwtUtils.generateToken(userDetails);
        return new TokenRefreshResponse(token, requestRefreshToken);
    }

    @Override
    @Transactional
    public MessageResponse logout(String token) {
        String jwt = token.startsWith("Bearer ") ? token.substring(7) : token;
        
        if (!jwtUtils.validateToken(jwt)) {
            // Already invalid, just return success
            return new MessageResponse("Logged out successfully");
        }

        String username = jwtUtils.extractUsername(jwt);
        userRepository.findByUsernameIgnoreCase(username).ifPresent(user -> {
            refreshTokenRepository.deleteByUser(user);
            log.info("Refresh token deleted for user: {}", username);
        });

        return new MessageResponse("Logged out successfully");
    }
}
