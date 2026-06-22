package com.apexgrid.userservice.service;

import com.apexgrid.userservice.dto.MessageResponse;
import com.apexgrid.userservice.dto.UpdateProfileRequest;
import com.apexgrid.userservice.dto.UserAdminResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface UserService {
    MessageResponse updateProfile(Integer userId, UpdateProfileRequest request);
    // B-14 Fix: paginated with search instead of findAll()
    Page<UserAdminResponse> getAllUsers(int page, int size, String search);
    MessageResponse toggleUserStatus(Integer userId);
    UserAdminResponse getUserById(Integer userId);
    MessageResponse adminAssignRole(Integer userId, String newRole);
}
