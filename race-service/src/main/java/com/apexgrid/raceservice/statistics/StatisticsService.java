package com.apexgrid.raceservice.statistics;

import com.apexgrid.raceservice.booking.repository.BookingRepository;
import com.apexgrid.raceservice.race.repository.CircuitRepository;
import com.apexgrid.raceservice.race.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsService {

    private final BookingRepository bookingRepository;
    private final RaceRepository raceRepository;
    private final CircuitRepository circuitRepository;

    public StatisticsResponse getOverview() {
        long confirmed = bookingRepository.countByStatus("CONFIRMED");
        long pending = bookingRepository.countByStatus("PENDING");
        long cancelled = bookingRepository.countByStatus("CANCELLED");
        BigDecimal revenue = bookingRepository.sumTotalPriceByStatus("CONFIRMED");
        Long ticketsSold = bookingRepository.sumQuantityByStatus("CONFIRMED");
        long uniqueCustomers = bookingRepository.countDistinctUsers();

        java.util.Map<String, BigDecimal> quarterlyRevenue = new java.util.HashMap<>();
        quarterlyRevenue.put("Q1", BigDecimal.ZERO);
        quarterlyRevenue.put("Q2", BigDecimal.ZERO);
        quarterlyRevenue.put("Q3", BigDecimal.ZERO);
        quarterlyRevenue.put("Q4", BigDecimal.ZERO);

        List<Object[]> revenueData = bookingRepository.findConfirmedBookingsRevenueData();
        for (Object[] row : revenueData) {
            LocalDateTime confirmedAt = (LocalDateTime) row[0];
            BigDecimal price = (BigDecimal) row[1];
            if (confirmedAt != null && price != null) {
                int month = confirmedAt.getMonthValue();
                String quarter = "Q1";
                if (month >= 4 && month <= 6) {
                    quarter = "Q2";
                } else if (month >= 7 && month <= 9) {
                    quarter = "Q3";
                } else if (month >= 10 && month <= 12) {
                    quarter = "Q4";
                }
                quarterlyRevenue.put(quarter, quarterlyRevenue.get(quarter).add(price));
            }
        }

        return StatisticsResponse.builder()
                .totalConfirmedBookings(confirmed)
                .totalPendingBookings(pending)
                .totalCancelledBookings(cancelled)
                .totalRevenue(revenue != null ? revenue : BigDecimal.ZERO)
                .totalTicketsSold(ticketsSold != null ? ticketsSold : 0L)
                .totalUniqueCustomers(uniqueCustomers)
                .totalRaces(raceRepository.count())
                .totalCircuits(circuitRepository.count())
                .quarterlyRevenue(quarterlyRevenue)
                .build();
    }

    public List<RacePopularityResponse> getPopularRaces() {
        return bookingRepository.findRacePopularity()
                .stream()
                .map(row -> RacePopularityResponse.builder()
                        .raceId((Integer) row[0])
                        .raceName((String) row[1])
                        .circuitName((String) row[2])
                        .country((String) row[3])
                        .ticketsSold(((Number) row[4]).longValue())
                        .revenue(row[5] != null ? new BigDecimal(row[5].toString()) : BigDecimal.ZERO)
                        .confirmedBookings(((Number) row[6]).longValue())
                        .build())
                .collect(Collectors.toList());
    }
}
