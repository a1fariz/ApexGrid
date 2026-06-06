package com.apexgrid.raceservice.race.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RaceResponse {

    private Integer id;
    private String name;
    private Integer circuitId;       // Added: needed by admin edit form to pre-select circuit
    private LocalDateTime raceDate;
    private LocalTime raceTime;
    private Integer season;
    private Integer round;
    private String circuitName;
    private String location;
    private String country;
    private BigDecimal lengthKm;
    private Integer availableQuota;
    private Integer totalQuota;
    private BigDecimal ticketPrice;
    private String currency;
    private String status;
    private String description;
    private String imageUrl;
    private String circuitImageUrl;
}

