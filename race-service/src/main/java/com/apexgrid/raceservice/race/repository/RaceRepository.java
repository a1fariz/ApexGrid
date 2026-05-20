package com.apexgrid.raceservice.race.repository;

import com.apexgrid.raceservice.race.entity.Race;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface RaceRepository extends JpaRepository<Race, Integer> {

    List<Race> findByStatusOrderByRaceDateAsc(String status);

    List<Race> findBySeasonOrderByRoundAsc(Integer season);

    List<Race> findByRaceDateAfterOrderByRaceDateAsc(LocalDateTime date);

    @Query("SELECT r FROM Race r JOIN FETCH r.circuit WHERE r.id = :id")
    Optional<Race> findByIdWithCircuit(@Param("id") Integer id);

    @Query("SELECT r FROM Race r JOIN FETCH r.circuit WHERE r.status = :status")
    List<Race> findByStatusWithCircuit(@Param("status") String status);

    boolean existsByNameAndSeason(String name, Integer season);

    @Query(value = "SELECT r FROM Race r JOIN FETCH r.circuit c WHERE " +
           "(:searchPattern IS NULL OR LOWER(r.name) LIKE :searchPattern OR LOWER(c.name) LIKE :searchPattern OR LOWER(c.country) LIKE :searchPattern) AND " +
           "(:season IS NULL OR r.season = :season) AND " +
           "(:status IS NULL OR r.status = :status)",
           countQuery = "SELECT COUNT(r) FROM Race r JOIN r.circuit c WHERE " +
           "(:searchPattern IS NULL OR LOWER(r.name) LIKE :searchPattern OR LOWER(c.name) LIKE :searchPattern OR LOWER(c.country) LIKE :searchPattern) AND " +
           "(:season IS NULL OR r.season = :season) AND " +
           "(:status IS NULL OR r.status = :status)")
    Page<Race> searchRaces(@Param("searchPattern") String searchPattern,
                           @Param("season") Integer season,
                           @Param("status") String status,
                           Pageable pageable);

    @Query("SELECT DISTINCT r.season FROM Race r ORDER BY r.season DESC")
    List<Integer> findDistinctSeasons();
}
