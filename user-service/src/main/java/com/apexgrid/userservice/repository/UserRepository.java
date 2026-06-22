package com.apexgrid.userservice.repository;

import com.apexgrid.userservice.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsernameIgnoreCase(String username);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCase(String email);

    // B-14 Fix: paginated user list with optional search across username, email, fullName
    // L-01 Fix: escape LIKE wildcards to prevent wildcard injection
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) ESCAPE '!' OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) ESCAPE '!' OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) ESCAPE '!'")
    Page<User> findAllWithSearch(@Param("search") String search, Pageable pageable);
}
