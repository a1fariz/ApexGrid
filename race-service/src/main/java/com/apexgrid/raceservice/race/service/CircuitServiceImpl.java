package com.apexgrid.raceservice.race.service;

import com.apexgrid.raceservice.exception.ApiException;
import com.apexgrid.raceservice.race.dto.CircuitRequest;
import com.apexgrid.raceservice.race.dto.CircuitResponse;
import com.apexgrid.raceservice.race.entity.Circuit;
import com.apexgrid.raceservice.race.repository.CircuitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CircuitServiceImpl implements CircuitService {

    private final CircuitRepository circuitRepository;

    @Override
    public List<CircuitResponse> getAllCircuits() {
        return circuitRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CircuitResponse getCircuitById(Integer id) {
        Circuit circuit = circuitRepository.findById(id)
                .orElseThrow(() -> new ApiException("Circuit not found with id: " + id, HttpStatus.NOT_FOUND));
        return mapToResponse(circuit);
    }

    @Override
    @Transactional
    public CircuitResponse createCircuit(CircuitRequest request) {
        if (circuitRepository.existsByName(request.getName())) {
            throw new ApiException("Circuit with name '" + request.getName() + "' already exists", HttpStatus.CONFLICT);
        }

        Circuit circuit = Circuit.builder()
                .name(request.getName())
                .location(request.getLocation())
                .country(request.getCountry())
                .lengthKm(request.getLengthKm())
                .numberOfLaps(request.getNumberOfLaps())
                .lapRecord(request.getLapRecord())
                .lapRecordHolder(request.getLapRecordHolder())
                .imageUrl(request.getImageUrl())
                .description(request.getDescription())
                .build();

        Circuit saved = circuitRepository.save(circuit);
        log.info("Circuit created: {} — {}, {}", saved.getName(), saved.getLocation(), saved.getCountry());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CircuitResponse updateCircuit(Integer id, CircuitRequest request) {
        Circuit circuit = circuitRepository.findById(id)
                .orElseThrow(() -> new ApiException("Circuit not found with id: " + id, HttpStatus.NOT_FOUND));

        circuit.setName(request.getName());
        circuit.setLocation(request.getLocation());
        circuit.setCountry(request.getCountry());
        circuit.setLengthKm(request.getLengthKm());
        circuit.setNumberOfLaps(request.getNumberOfLaps());
        circuit.setLapRecord(request.getLapRecord());
        circuit.setLapRecordHolder(request.getLapRecordHolder());
        if (request.getImageUrl() != null) circuit.setImageUrl(request.getImageUrl());
        if (request.getDescription() != null) circuit.setDescription(request.getDescription());

        Circuit saved = circuitRepository.save(circuit);
        log.info("Circuit updated: {}", saved.getName());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteCircuit(Integer id) {
        Circuit circuit = circuitRepository.findById(id)
                .orElseThrow(() -> new ApiException("Circuit not found with id: " + id, HttpStatus.NOT_FOUND));

        // Check if circuit is used by any race
        if (circuit.getRaces() != null && !circuit.getRaces().isEmpty()) {
            throw new ApiException("Cannot delete circuit: it is linked to " + circuit.getRaces().size() + " race(s)", HttpStatus.CONFLICT);
        }

        circuitRepository.delete(circuit);
        log.info("Circuit deleted: {}", id);
    }

    private CircuitResponse mapToResponse(Circuit circuit) {
        return CircuitResponse.builder()
                .id(circuit.getId())
                .name(circuit.getName())
                .location(circuit.getLocation())
                .country(circuit.getCountry())
                .lengthKm(circuit.getLengthKm())
                .numberOfLaps(circuit.getNumberOfLaps())
                .lapRecord(circuit.getLapRecord())
                .lapRecordHolder(circuit.getLapRecordHolder())
                .imageUrl(circuit.getImageUrl())
                .description(circuit.getDescription())
                .build();
    }
}
