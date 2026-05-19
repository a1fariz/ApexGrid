package com.apexgrid.raceservice.race.controller;

import com.apexgrid.raceservice.race.dto.CircuitResponse;
import com.apexgrid.raceservice.race.dto.RaceRequest;
import com.apexgrid.raceservice.race.dto.RaceResponse;
import com.apexgrid.raceservice.race.service.RaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/races")
@RequiredArgsConstructor
public class RaceController {

    private final RaceService raceService;

    @GetMapping
    public ResponseEntity<List<RaceResponse>> getAllRaces() {
        return ResponseEntity.ok(raceService.getAllRaces());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<RaceResponse>> getUpcomingRaces() {
        return ResponseEntity.ok(raceService.getUpcomingRaces());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RaceResponse> getRaceById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(raceService.getRaceById(id));
    }

    @GetMapping("/circuits")
    public ResponseEntity<List<CircuitResponse>> getAllCircuits() {
        return ResponseEntity.ok(raceService.getAllCircuits());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RaceResponse> createRace(@Valid @RequestBody RaceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(raceService.createRace(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RaceResponse> updateRace(@PathVariable("id") Integer id,
                                                    @Valid @RequestBody RaceRequest request) {
        return ResponseEntity.ok(raceService.updateRace(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRace(@PathVariable("id") Integer id) {
        raceService.deleteRace(id);
        return ResponseEntity.noContent().build();
    }
}
