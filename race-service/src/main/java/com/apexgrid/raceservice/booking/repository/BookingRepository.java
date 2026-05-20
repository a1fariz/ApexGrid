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

    // Statistics queries
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = :status")
    long countByStatus(@Param("status") String status);

    @Query("SELECT COALESCE(SUM(b.totalPrice), 0) FROM Booking b WHERE b.status = :status")
    java.math.BigDecimal sumTotalPriceByStatus(@Param("status") String status);

    @Query("SELECT COALESCE(SUM(b.quantity), 0) FROM Booking b WHERE b.status = :status")
    Long sumQuantityByStatus(@Param("status") String status);

    @Query("SELECT COUNT(DISTINCT b.userId) FROM Booking b")
    long countDistinctUsers();

    @Query("SELECT r.id, r.name, c.name, c.country, " +
           "COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.quantity ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.totalPrice ELSE 0 END), 0), " +
           "COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) " +
           "FROM Race r JOIN r.circuit c LEFT JOIN Booking b ON b.race = r " +
           "GROUP BY r.id, r.name, c.name, c.country " +
           "ORDER BY COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.quantity ELSE 0 END), 0) DESC")
    List<Object[]> findRacePopularity();
}
