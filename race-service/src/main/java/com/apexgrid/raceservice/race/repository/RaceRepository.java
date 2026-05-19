package com.apexgrid.raceservice.race.repository;

import com.apexgrid.raceservice.race.entity.Race;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
}
