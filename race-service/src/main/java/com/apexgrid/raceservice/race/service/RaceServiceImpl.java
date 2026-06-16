package com.apexgrid.raceservice.race.service;

import com.apexgrid.raceservice.exception.ApiException;
import com.apexgrid.raceservice.race.dto.CircuitResponse;
import com.apexgrid.raceservice.race.dto.RaceRequest;
import com.apexgrid.raceservice.race.dto.RaceResponse;
import com.apexgrid.raceservice.race.entity.Circuit;
import com.apexgrid.raceservice.race.entity.Race;
import com.apexgrid.raceservice.race.repository.CircuitRepository;
import com.apexgrid.raceservice.race.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
@Slf4j
public class RaceServiceImpl implements RaceService {

    private final RaceRepository raceRepository;
    private final CircuitRepository circuitRepository;

    @Override
    public List<RaceResponse> getAllRaces() {
        // Fix N+1: use JOIN FETCH to load all races + circuits in a single query
        return raceRepository.findAllWithCircuit()
                .stream()
                .map(this::mapToRaceResponse)
                .collect(Collectors.toList());
    }

    @Override
    public RaceResponse getRaceById(Integer id) {
        Race race = raceRepository.findByIdWithCircuit(id)
                .orElseThrow(() -> new ApiException("Race not found with id: " + id, HttpStatus.NOT_FOUND));
        return mapToRaceResponse(race);
    }

    @Override
    @Transactional
    public RaceResponse createRace(RaceRequest request) {
        Circuit circuit = circuitRepository.findById(request.getCircuitId())
                .orElseThrow(() -> new ApiException("Circuit not found with id: " + request.getCircuitId(), HttpStatus.NOT_FOUND));

        Race race = Race.builder()
                .name(request.getName())
                .circuit(circuit)
                .raceDate(request.getRaceDate())
                .raceTime(request.getRaceTime())
                .season(request.getSeason())
                .round(request.getRound())
                .totalQuota(request.getTotalQuota())
                .availableQuota(request.getTotalQuota())
                .ticketPrice(request.getTicketPrice())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : "UPCOMING")
                .imageUrl(request.getImageUrl())
                .currency("USD")
                .build();

        Race savedRace = raceRepository.save(race);
        log.info("Race created: {}", savedRace.getName());
        return mapToRaceResponse(savedRace);
    }

    @Override
    @Transactional
    public RaceResponse updateRace(Integer id, RaceRequest request) {
        Race race = raceRepository.findById(id)
                .orElseThrow(() -> new ApiException("Race not found with id: " + id, HttpStatus.NOT_FOUND));

        Circuit circuit = circuitRepository.findById(request.getCircuitId())
                .orElseThrow(() -> new ApiException("Circuit not found with id: " + request.getCircuitId(), HttpStatus.NOT_FOUND));

        race.setName(request.getName());
        race.setCircuit(circuit);
        race.setRaceDate(request.getRaceDate());
        race.setRaceTime(request.getRaceTime());
        race.setSeason(request.getSeason());
        race.setRound(request.getRound());

        // Fix: sync availableQuota proportionally when totalQuota changes
        int oldTotal = race.getTotalQuota() != null ? race.getTotalQuota() : 0;
        int newTotal = request.getTotalQuota();
        int delta = newTotal - oldTotal;
        int currentAvailable = race.getAvailableQuota() != null ? race.getAvailableQuota() : 0;
        int newAvailable = Math.max(0, currentAvailable + delta);
        race.setTotalQuota(newTotal);
        race.setAvailableQuota(newAvailable);

        race.setTicketPrice(request.getTicketPrice());
        race.setDescription(request.getDescription());
        if (request.getStatus() != null) race.setStatus(request.getStatus());
        if (request.getImageUrl() != null) race.setImageUrl(request.getImageUrl());

        Race savedRace = raceRepository.save(race);
        log.info("Race updated: {}", savedRace.getName());
        return mapToRaceResponse(savedRace);
    }

    @Override
    @Transactional
    public void deleteRace(Integer id) {
        Race race = raceRepository.findById(id)
                .orElseThrow(() -> new ApiException("Race not found with id: " + id, HttpStatus.NOT_FOUND));
        raceRepository.delete(race);
        log.info("Race deleted: {}", id);
    }

    @Override
    public List<RaceResponse> getUpcomingRaces() {
        return raceRepository.findByStatusWithCircuit("UPCOMING")
                .stream()
                .map(this::mapToRaceResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CircuitResponse> getAllCircuits() {
        return circuitRepository.findAll()
                .stream()
                .map(this::mapToCircuitResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<RaceResponse> searchRaces(String search, Integer season, String status, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        
        String searchPattern = (search != null && !search.trim().isEmpty()) 
                ? "%" + search.trim().toLowerCase() + "%" 
                : null;
        String statusFilter = (status != null && !status.trim().isEmpty()) 
                ? status.trim().toUpperCase() 
                : null;

        Page<Race> racePage = raceRepository.searchRaces(
                searchPattern,
                season,
                statusFilter,
                pageRequest
        );
        return racePage.map(this::mapToRaceResponse);
    }

    @Override
    public List<Integer> getSeasons() {
        return raceRepository.findDistinctSeasons();
    }

    private RaceResponse mapToRaceResponse(Race race) {
        Circuit circuit = race.getCircuit();
        String effectiveStatus = race.getStatus();
        if (!"CANCELLED".equals(effectiveStatus) && race.getRaceDate() != null && race.getRaceDate().isBefore(LocalDateTime.now())) {
            effectiveStatus = "COMPLETED";
        }

        return RaceResponse.builder()
                .id(race.getId())
                .name(race.getName())
                .circuitId(circuit != null ? circuit.getId() : null)
                .raceDate(race.getRaceDate())
                .raceTime(race.getRaceTime())
                .season(race.getSeason())
                .round(race.getRound())
                .circuitName(circuit != null ? circuit.getName() : null)
                .location(circuit != null ? circuit.getLocation() : null)
                .country(circuit != null ? circuit.getCountry() : null)
                .lengthKm(circuit != null ? circuit.getLengthKm() : null)
                .availableQuota(race.getAvailableQuota())
                .totalQuota(race.getTotalQuota())
                .ticketPrice(race.getTicketPrice())
                .currency(race.getCurrency())
                .status(effectiveStatus)
                .description(race.getDescription())
                .imageUrl(race.getImageUrl())
                .circuitImageUrl(circuit != null ? circuit.getImageUrl() : null)
                .build();
    }

    private CircuitResponse mapToCircuitResponse(Circuit circuit) {
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
