package com.apexgrid.raceservice.statistics;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StatisticsResponse> getOverview() {
        return ResponseEntity.ok(statisticsService.getOverview());
    }

    @GetMapping("/popular")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RacePopularityResponse>> getPopularRaces() {
        return ResponseEntity.ok(statisticsService.getPopularRaces());
    }
}
