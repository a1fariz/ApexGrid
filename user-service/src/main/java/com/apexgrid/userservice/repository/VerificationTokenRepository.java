package com.apexgrid.userservice.repository;

import com.apexgrid.userservice.entity.User;
import com.apexgrid.userservice.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Integer> {
    Optional<VerificationToken> findByToken(String token);

    // For resend verification: delete existing token before creating a new one
    @Modifying
    @Transactional
    @Query("DELETE FROM VerificationToken v WHERE v.user = :user")
    void deleteByUser(@Param("user") User user);
}
