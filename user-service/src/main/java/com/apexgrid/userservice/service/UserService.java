package com.apexgrid.userservice.service;

import com.apexgrid.userservice.dto.MessageResponse;
import com.apexgrid.userservice.dto.UpdateProfileRequest;
import com.apexgrid.userservice.dto.UserAdminResponse;

import java.util.List;

public interface UserService {
    MessageResponse updateProfile(Integer userId, UpdateProfileRequest request);
    List<UserAdminResponse> getAllUsers();
    MessageResponse toggleUserStatus(Integer userId);
}
