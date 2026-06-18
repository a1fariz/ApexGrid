package com.apexgrid.raceservice.scheduler;

import com.apexgrid.raceservice.booking.entity.Booking;
import com.apexgrid.raceservice.booking.repository.BookingRepository;
import com.apexgrid.raceservice.email.EmailService;
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

    /**
     * Every 5 minutes: auto-cancel expired PENDING bookings.
     * Trigger DB (trg_update_quota) will NOT restore quota here because
     * quota was never reduced for PENDING bookings — only CONFIRMED bookings reduce quota.
     */
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

                log.info("Auto-cancelled booking: {}", booking.getBookingCode());

                // Send async cancellation email
                emailService.sendBookingCancellation(booking, booking.getUserEmail());

            } catch (Exception e) {
                log.error("Error auto-cancelling booking {}: {}", booking.getBookingCode(), e.getMessage());
            }
        }

        log.info("Completed auto-cancellation run. Cancelled {} bookings.", expiredBookings.size());
    }

    /**
     * B-11 Fix: Every hour, persist COMPLETED status for races whose date has passed.
     * Previously this was computed at response time only (not stored in DB).
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void markCompletedRaces() {
        LocalDateTime now = LocalDateTime.now();
        int updated = raceRepository.markRacesAsCompleted(now);
        if (updated > 0) {
            log.info("B-11 Fix: Marked {} races as COMPLETED (raceDate < {})", updated, now);
        }
    }
}
