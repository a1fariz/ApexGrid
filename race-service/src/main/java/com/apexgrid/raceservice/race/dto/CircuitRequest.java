package com.apexgrid.raceservice.race.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CircuitRequest {

    @NotBlank(message = "Circuit name is required")
    @Size(max = 100, message = "Circuit name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Location is required")
    @Size(max = 100, message = "Location must not exceed 100 characters")
    private String location;

    @NotBlank(message = "Country is required")
    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String country;

    @DecimalMin(value = "0.0", inclusive = false, message = "Track length must be positive")
    private BigDecimal lengthKm;

    @Min(value = 1, message = "Number of laps must be at least 1")
    private Integer numberOfLaps;

    private String lapRecord;
    private String lapRecordHolder;
    private String imageUrl;
    private String description;
}
