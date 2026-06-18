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
public class StatisticsResponse {
    private Long totalConfirmedBookings;
    private Long totalPendingBookings;
    private Long totalCancelledBookings;
    private BigDecimal totalRevenue;
    private Long totalTicketsSold;
    private Long totalUniqueCustomers;
    private Long totalRaces;
    private Long totalCircuits;
    private java.util.Map<String, BigDecimal> quarterlyRevenue;
}
