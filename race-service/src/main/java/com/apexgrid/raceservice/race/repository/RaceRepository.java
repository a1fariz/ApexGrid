package com.apexgrid.raceservice.race.repository;

import com.apexgrid.raceservice.race.entity.Race;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RaceRepository extends JpaRepository<Race, Integer> {

    // Fix N+1: load all races with their circuits in a single JOIN query (M-04: capped via Pageable)
    @Query("SELECT r FROM Race r JOIN FETCH r.circuit")
    Page<Race> findAllWithCircuit(Pageable pageable);


    @Query("SELECT r FROM Race r JOIN FETCH r.circuit WHERE r.id = :id")
    Optional<Race> findByIdWithCircuit(@Param("id") Integer id);

    // B-01 Fix: Pessimistic lock variant for booking creation to prevent race condition on quota
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Race r JOIN FETCH r.circuit WHERE r.id = :id")
    Optional<Race> findByIdWithCircuitForUpdate(@Param("id") Integer id);

    @Query("SELECT r FROM Race r JOIN FETCH r.circuit WHERE r.status = :status")
    Page<Race> findByStatusWithCircuit(@Param("status") String status, Pageable pageable);

    boolean existsByNameAndSeason(String name, Integer season);

    @Query(value = "SELECT r FROM Race r JOIN FETCH r.circuit c WHERE " +
           "(:searchPattern IS NULL OR LOWER(r.name) LIKE :searchPattern OR LOWER(c.name) LIKE :searchPattern OR LOWER(c.country) LIKE :searchPattern) AND " +
           "(:season IS NULL OR r.season = :season) AND " +
           "(:status IS NULL OR " +
           "  (:status = 'COMPLETED' AND (r.status = 'COMPLETED' OR r.raceDate < CURRENT_TIMESTAMP)) OR " +
           "  (:status != 'COMPLETED' AND r.status = :status AND r.raceDate >= CURRENT_TIMESTAMP) " +
           ") " +
           "ORDER BY CASE WHEN r.raceDate < CURRENT_TIMESTAMP THEN 1 ELSE 0 END ASC, r.raceDate ASC",
           countQuery = "SELECT COUNT(r) FROM Race r JOIN r.circuit c WHERE " +
           "(:searchPattern IS NULL OR LOWER(r.name) LIKE :searchPattern OR LOWER(c.name) LIKE :searchPattern OR LOWER(c.country) LIKE :searchPattern) AND " +
           "(:season IS NULL OR r.season = :season) AND " +
           "(:status IS NULL OR " +
           "  (:status = 'COMPLETED' AND (r.status = 'COMPLETED' OR r.raceDate < CURRENT_TIMESTAMP)) OR " +
           "  (:status != 'COMPLETED' AND r.status = :status AND r.raceDate >= CURRENT_TIMESTAMP) " +
           ")")
    Page<Race> searchRaces(@Param("searchPattern") String searchPattern,
                           @Param("season") Integer season,
                           @Param("status") String status,
                           Pageable pageable);

    @Query("SELECT DISTINCT r.season FROM Race r ORDER BY r.season DESC")
    List<Integer> findDistinctSeasons();

    // B-11 Fix: Persist COMPLETED status for races whose date has passed
    @Modifying
    @Query("UPDATE Race r SET r.status = 'COMPLETED' WHERE r.status = 'UPCOMING' AND r.raceDate < :now")
    int markRacesAsCompleted(@Param("now") LocalDateTime now);
}
