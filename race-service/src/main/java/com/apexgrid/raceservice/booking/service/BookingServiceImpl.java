package com.apexgrid.raceservice.booking.service;

import com.apexgrid.raceservice.booking.dto.BookingRequest;
import com.apexgrid.raceservice.booking.dto.BookingResponse;
import com.apexgrid.raceservice.booking.entity.Booking;
import com.apexgrid.raceservice.booking.repository.BookingRepository;
import com.apexgrid.raceservice.email.EmailService;
import com.apexgrid.raceservice.exception.ApiException;
import com.apexgrid.raceservice.race.entity.Race;
import com.apexgrid.raceservice.race.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final RaceRepository raceRepository;
    private final EmailService emailService;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom random = new SecureRandom();

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request, Integer userId) {
        // 1. Check race exists and is UPCOMING
        Race race = raceRepository.findByIdWithCircuit(request.getRaceId())
                .orElseThrow(() -> new ApiException("Race not found with id: " + request.getRaceId(), HttpStatus.NOT_FOUND));

        if (!"UPCOMING".equals(race.getStatus())) {
            throw new ApiException("Race is not available for booking. Status: " + race.getStatus(), HttpStatus.BAD_REQUEST);
        }

        // 2. Check available quota
        if (race.getAvailableQuota() < request.getQuantity()) {
            throw new ApiException(
                "Insufficient quota. Available: " + race.getAvailableQuota() + ", Requested: " + request.getQuantity(),
                HttpStatus.BAD_REQUEST
            );
        }

        // 3. Generate unique booking code (format: APEX-XXXXXX)
        String bookingCode = generateUniqueBookingCode();

        // 4. Calculate total price
        BigDecimal totalPrice = race.getTicketPrice().multiply(BigDecimal.valueOf(request.getQuantity()));

        // 5. Save booking with PENDING status
        // NOTE: PostgreSQL trigger will:
        //   - Set expired_at = created_at + 30 minutes (on INSERT)
        //   - Reduce available_quota when status changes to CONFIRMED
        //   - Restore available_quota when status changes to CANCELLED
        Booking booking = Booking.builder()
                .bookingCode(bookingCode)
                .userId(userId)
                .race(race)
                .quantity(request.getQuantity())
                .totalPrice(totalPrice)
                .status("PENDING")
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // 6. Send async email confirmation
        emailService.sendBookingConfirmation(savedBooking, null);

        log.info("Booking created: {} for userId: {} — raceId: {}", bookingCode, userId, race.getId());
        return mapToBookingResponse(savedBooking);
    }

    @Override
    public List<BookingResponse> getUserBookings(Integer userId) {
        return bookingRepository.findByUserIdWithRace(userId)
                .stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponse getBookingByCode(String code) {
        Booking booking = bookingRepository.findByBookingCode(code)
                .orElseThrow(() -> new ApiException("Booking not found with code: " + code, HttpStatus.NOT_FOUND));
        return mapToBookingResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse confirmBooking(Integer bookingId) {
        Booking booking = bookingRepository.findByIdWithRace(bookingId)
                .orElseThrow(() -> new ApiException("Booking not found with id: " + bookingId, HttpStatus.NOT_FOUND));

        if (!"PENDING".equals(booking.getStatus())) {
            throw new ApiException("Only PENDING bookings can be confirmed. Current status: " + booking.getStatus(), HttpStatus.BAD_REQUEST);
        }

        // Check if expired
        if (booking.getExpiredAt() != null && LocalDateTime.now().isAfter(booking.getExpiredAt())) {
            throw new ApiException("Booking has expired and cannot be confirmed", HttpStatus.BAD_REQUEST);
        }

        booking.setStatus("CONFIRMED");
        booking.setConfirmedAt(LocalDateTime.now());

        // PostgreSQL trigger (trg_update_quota) will:
        // CONFIRMED from PENDING → reduce available_quota by booking.quantity
        Booking confirmed = bookingRepository.save(booking);

        log.info("Booking confirmed: {}", confirmed.getBookingCode());
        return mapToBookingResponse(confirmed);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Integer bookingId, String reason) {
        Booking booking = bookingRepository.findByIdWithRace(bookingId)
                .orElseThrow(() -> new ApiException("Booking not found with id: " + bookingId, HttpStatus.NOT_FOUND));

        if ("CANCELLED".equals(booking.getStatus())) {
            throw new ApiException("Booking is already cancelled", HttpStatus.BAD_REQUEST);
        }

        booking.setStatus("CANCELLED");
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancellationReason(reason != null ? reason : "Cancelled by user");

        // PostgreSQL trigger (trg_update_quota) will:
        // CANCELLED from PENDING → restore available_quota
        // CANCELLED from CONFIRMED → restore available_quota
        Booking cancelled = bookingRepository.save(booking);

        // Send async cancellation email
        emailService.sendBookingCancellation(cancelled, null);

        log.info("Booking cancelled: {} — reason: {}", cancelled.getBookingCode(), reason);
        return mapToBookingResponse(cancelled);
    }

    private String generateUniqueBookingCode() {
        String code;
        int attempts = 0;
        do {
            StringBuilder sb = new StringBuilder("APEX-");
            for (int i = 0; i < 6; i++) {
                sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
            }
            code = sb.toString();
            attempts++;
            if (attempts > 10) {
                throw new ApiException("Failed to generate unique booking code", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } while (bookingRepository.existsByBookingCode(code));
        return code;
    }

    private BookingResponse mapToBookingResponse(Booking booking) {
        Race race = booking.getRace();
        String circuitName = null;
        String country = null;
        if (race != null && race.getCircuit() != null) {
            circuitName = race.getCircuit().getName();
            country = race.getCircuit().getCountry();
        }

        return BookingResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .userId(booking.getUserId())
                .raceId(race != null ? race.getId() : null)
                .raceName(race != null ? race.getName() : null)
                .circuitName(circuitName)
                .country(country)
                .raceDate(race != null ? race.getRaceDate() : null)
                .quantity(booking.getQuantity())
                .totalPrice(booking.getTotalPrice())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .expiredAt(booking.getExpiredAt())
                .confirmedAt(booking.getConfirmedAt())
                .cancelledAt(booking.getCancelledAt())
                .cancellationReason(booking.getCancellationReason())
                .build();
    }
}
