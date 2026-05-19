package com.apexgrid.raceservice.booking.repository;

import com.apexgrid.raceservice.booking.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {

    List<Booking> findByUserIdOrderByCreatedAtDesc(Integer userId);

    Optional<Booking> findByBookingCode(String bookingCode);

    List<Booking> findByStatus(String status);

    @Query("SELECT b FROM Booking b JOIN FETCH b.race r JOIN FETCH r.circuit WHERE b.userId = :userId ORDER BY b.createdAt DESC")
    List<Booking> findByUserIdWithRace(@Param("userId") Integer userId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.race r JOIN FETCH r.circuit WHERE b.id = :id")
    Optional<Booking> findByIdWithRace(@Param("id") Integer id);

    @Query("SELECT b FROM Booking b WHERE b.status = 'PENDING' AND b.expiredAt < :now")
    List<Booking> findExpiredPendingBookings(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.race.id = :raceId AND b.status IN ('PENDING', 'CONFIRMED')")
    Long countActiveBookingsByRaceId(@Param("raceId") Integer raceId);

    boolean existsByBookingCode(String bookingCode);
}
