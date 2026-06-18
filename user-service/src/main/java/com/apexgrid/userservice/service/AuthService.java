package com.apexgrid.userservice.service;

import com.apexgrid.userservice.dto.*;

public interface AuthService {
    MessageResponse register(RegisterRequest request);
    JwtResponse login(LoginRequest request);
    UserResponse getCurrentUser(String token);
    MessageResponse verifyEmail(String token);
    MessageResponse resendVerification(String email);
    MessageResponse forgotPassword(ForgotPasswordRequest request);
    MessageResponse resetPassword(ResetPasswordRequest request);
    TokenRefreshResponse refreshToken(TokenRefreshRequest request);
    MessageResponse logout(String token);
}
