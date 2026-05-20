package com.apexgrid.raceservice.statistics;

import com.apexgrid.raceservice.booking.repository.BookingRepository;
import com.apexgrid.raceservice.race.repository.CircuitRepository;
import com.apexgrid.raceservice.race.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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

        return StatisticsResponse.builder()
                .totalConfirmedBookings(confirmed)
                .totalPendingBookings(pending)
                .totalCancelledBookings(cancelled)
                .totalRevenue(revenue != null ? revenue : BigDecimal.ZERO)
                .totalTicketsSold(ticketsSold != null ? ticketsSold : 0L)
                .totalUniqueCustomers(uniqueCustomers)
                .totalRaces(raceRepository.count())
                .totalCircuits(circuitRepository.count())
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
