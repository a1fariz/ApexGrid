package com.apexgrid.raceservice.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RacePopularityResponse {
    private Integer raceId;
    private String raceName;
    private String circuitName;
    private String country;
    private Long ticketsSold;
    private BigDecimal revenue;
    private Long confirmedBookings;
}
