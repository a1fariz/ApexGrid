package com.apexgrid.raceservice.race.service;

import com.apexgrid.raceservice.race.dto.CircuitResponse;
import com.apexgrid.raceservice.race.dto.RaceRequest;
import com.apexgrid.raceservice.race.dto.RaceResponse;

import java.util.List;

public interface RaceService {
    List<RaceResponse> getAllRaces();
    RaceResponse getRaceById(Integer id);
    RaceResponse createRace(RaceRequest request);
    RaceResponse updateRace(Integer id, RaceRequest request);
    void deleteRace(Integer id);
    List<RaceResponse> getUpcomingRaces();
    List<CircuitResponse> getAllCircuits();
}
