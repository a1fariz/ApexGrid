package com.apexgrid.raceservice.race.repository;

import com.apexgrid.raceservice.race.entity.Circuit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CircuitRepository extends JpaRepository<Circuit, Integer> {
    Optional<Circuit> findByName(String name);
    boolean existsByName(String name);
}
