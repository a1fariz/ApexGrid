package com.apexgrid.raceservice.race.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CircuitResponse {

    private Integer id;
    private String name;
    private String location;
    private String country;
    private BigDecimal lengthKm;
    private Integer numberOfLaps;
    private String lapRecord;
    private String lapRecordHolder;
    private String imageUrl;
    private String description;
}
