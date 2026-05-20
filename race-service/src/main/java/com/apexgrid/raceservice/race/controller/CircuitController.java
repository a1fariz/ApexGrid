package com.apexgrid.raceservice.race.controller;

import com.apexgrid.raceservice.race.dto.CircuitRequest;
import com.apexgrid.raceservice.race.dto.CircuitResponse;
import com.apexgrid.raceservice.race.service.CircuitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/circuits")
@RequiredArgsConstructor
public class CircuitController {

    private final CircuitService circuitService;

    @GetMapping
    public ResponseEntity<List<CircuitResponse>> getAllCircuits() {
        return ResponseEntity.ok(circuitService.getAllCircuits());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CircuitResponse> getCircuitById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(circuitService.getCircuitById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CircuitResponse> createCircuit(@Valid @RequestBody CircuitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(circuitService.createCircuit(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CircuitResponse> updateCircuit(@PathVariable("id") Integer id,
                                                          @Valid @RequestBody CircuitRequest request) {
        return ResponseEntity.ok(circuitService.updateCircuit(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCircuit(@PathVariable("id") Integer id) {
        circuitService.deleteCircuit(id);
        return ResponseEntity.noContent().build();
    }
}
