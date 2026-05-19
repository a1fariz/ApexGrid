package com.apexgrid.raceservice.scheduler;

import com.apexgrid.raceservice.booking.entity.Booking;
import com.apexgrid.raceservice.booking.repository.BookingRepository;
import com.apexgrid.raceservice.email.EmailService;
import com.apexgrid.raceservice.race.entity.Race;
import com.apexgrid.raceservice.race.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingScheduler {

    private final BookingRepository bookingRepository;
    private final RaceRepository raceRepository;
    private final EmailService emailService;

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void cancelExpiredBookings() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> expiredBookings = bookingRepository.findExpiredPendingBookings(now);

        if (expiredBookings.isEmpty()) {
            log.debug("No expired pending bookings found at {}", now);
            return;
        }

        log.info("Found {} expired bookings to cancel", expiredBookings.size());

        for (Booking booking : expiredBookings) {
            try {
                booking.setStatus("CANCELLED");
                booking.setCancelledAt(now);
                booking.setCancellationReason("Auto-cancelled: booking expired after 30 minutes");

                bookingRepository.save(booking);

                // Restore race quota (trigger handles this on status change, but be safe)
                // Trigger: CANCELLED from PENDING -> restore quota
                // The trigger should handle this automatically after bookingRepository.save()

                log.info("Auto-cancelled booking: {}", booking.getBookingCode());

                // Send async cancellation email
                emailService.sendBookingCancellation(booking, null);

            } catch (Exception e) {
                log.error("Error auto-cancelling booking {}: {}", booking.getBookingCode(), e.getMessage());
            }
        }

        log.info("Completed auto-cancellation run. Cancelled {} bookings.", expiredBookings.size());
    }
}
