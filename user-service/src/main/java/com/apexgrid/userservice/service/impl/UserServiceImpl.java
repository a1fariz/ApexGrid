package com.apexgrid.userservice.service.impl;

import com.apexgrid.userservice.dto.MessageResponse;
import com.apexgrid.userservice.dto.ProfileUpdateResponse;
import com.apexgrid.userservice.dto.UpdateProfileRequest;
import com.apexgrid.userservice.dto.UserAdminResponse;
import com.apexgrid.userservice.security.JwtUtils;
import com.apexgrid.userservice.security.UserDetailsImpl;
import com.apexgrid.userservice.entity.Role;
import com.apexgrid.userservice.entity.User;
import com.apexgrid.userservice.exception.ApiException;
import com.apexgrid.userservice.repository.RoleRepository;
import com.apexgrid.userservice.repository.UserRepository;
import com.apexgrid.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Override
    @Transactional
    public ProfileUpdateResponse updateProfile(Integer userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }

        // B-08 Fix: require current password before allowing a password change
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()) {
                throw new ApiException("Current password is required to change your password", HttpStatus.BAD_REQUEST);
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new ApiException("Current password is incorrect", HttpStatus.FORBIDDEN);
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(user);

        // Generate new token with updated user details
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String newToken = jwtUtils.generateToken(userDetails);

        return new ProfileUpdateResponse("Profile updated successfully", newToken);
    }

    @Override
    public Page<UserAdminResponse> getAllUsers(int page, int size, String search) {
        // B-14 Fix: paginated instead of findAll() to prevent OOM with large datasets
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String rawSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        // L-01 Fix: escape LIKE wildcards to prevent wildcard injection
        String searchParam = rawSearch != null
                ? rawSearch.replace("!", "!!").replace("%", "!%").replace("_", "!_")
                : null;

        Page<User> userPage;
        if (searchParam == null) {
            userPage = userRepository.findAll(pageRequest);
        } else {
            userPage = userRepository.findAllWithSearch(searchParam, pageRequest);
        }

        return userPage.map(user -> UserAdminResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(user.getRole().getName())
                        .isActive(user.getIsActive())
                        .isVerified(user.getIsVerified())
                        .createdAt(user.getCreatedAt())
                        .build());
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

    @Override
    public UserAdminResponse getUserById(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        return UserAdminResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }


    @Override
    @Transactional
    public MessageResponse adminAssignRole(Integer userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        Role role = roleRepository.findByName(newRole.toUpperCase())
                .orElseThrow(() -> new ApiException("Role '" + newRole + "' not found", HttpStatus.BAD_REQUEST));

        user.setRole(role);
        userRepository.save(user);

        log.info("Admin assigned role {} to user: {}", role.getName(), user.getUsername());
        return new MessageResponse("User role updated to " + role.getName() + " successfully.");
    }
}
