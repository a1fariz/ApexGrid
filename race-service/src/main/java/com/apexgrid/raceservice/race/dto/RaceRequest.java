package com.apexgrid.raceservice.race.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class RaceRequest {

    @NotBlank(message = "Race name is required")
    @Size(max = 100, message = "Race name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Circuit ID is required")
    private Integer circuitId;

    @NotNull(message = "Race date is required")
    private LocalDateTime raceDate;

    private LocalTime raceTime;

    @NotNull(message = "Season is required")
    private Integer season;

    private Integer round;

    @NotNull(message = "Total quota is required")
    @Min(value = 1, message = "Total quota must be at least 1")
    private Integer totalQuota;

    @NotNull(message = "Ticket price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Ticket price must be positive")
    private BigDecimal ticketPrice;

    private String description;

    private String status = "UPCOMING";

    private String imageUrl;
}
