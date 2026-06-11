package com.apexgrid.raceservice.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class BookingRequest {

    @NotNull(message = "Race ID is required")
    private Integer raceId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 10, message = "Maximum 10 tickets per booking")
    private Integer quantity;

    @Pattern(regexp = "^(GA|GS|VIP)$", message = "Zone must be GA, GS, or VIP")
    private String zone = "GA";
}
