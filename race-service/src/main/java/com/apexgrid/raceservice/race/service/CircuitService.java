package com.apexgrid.raceservice.race.service;

import com.apexgrid.raceservice.race.dto.CircuitRequest;
import com.apexgrid.raceservice.race.dto.CircuitResponse;

import java.util.List;

public interface CircuitService {
    List<CircuitResponse> getAllCircuits();
    CircuitResponse getCircuitById(Integer id);
    CircuitResponse createCircuit(CircuitRequest request);
    CircuitResponse updateCircuit(Integer id, CircuitRequest request);
    void deleteCircuit(Integer id);
}
