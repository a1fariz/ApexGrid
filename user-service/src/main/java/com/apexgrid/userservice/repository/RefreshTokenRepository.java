package com.apexgrid.userservice.repository;

import com.apexgrid.userservice.entity.RefreshToken;
import com.apexgrid.userservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByUser(User user);
    
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    int deleteByUser(User user);
}
