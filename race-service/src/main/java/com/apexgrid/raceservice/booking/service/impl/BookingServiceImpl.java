package com.apexgrid.raceservice.booking.service.impl;

import com.apexgrid.raceservice.booking.dto.BookingRequest;
import com.apexgrid.raceservice.booking.dto.BookingResponse;
import com.apexgrid.raceservice.booking.entity.Booking;
import com.apexgrid.raceservice.booking.repository.BookingRepository;
import com.apexgrid.raceservice.booking.service.BookingService;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final RaceRepository raceRepository;
    private final EmailService emailService;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom random = new SecureRandom();

    // Zone price multipliers — mirrors frontend TICKET_ZONES
    private static final java.util.Map<String, Double> ZONE_MULTIPLIERS = java.util.Map.of(
            "GA",  1.0,
            "GS",  2.5,
            "VIP", 6.0
    );

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request, Integer userId, String userEmail, String username, String userFullName) {
        // 1. Check race exists and is UPCOMING — B-01: use PESSIMISTIC_WRITE lock to prevent race condition
        Race race = raceRepository.findByIdWithCircuitForUpdate(request.getRaceId())
                .orElseThrow(
                        () -> new ApiException("Race not found with id: " + request.getRaceId(), HttpStatus.NOT_FOUND));

        // Double-booking prevention: user cannot have two active bookings for the same race
        boolean alreadyBooked = bookingRepository.existsActiveBookingByUserAndRace(userId, request.getRaceId());
        if (alreadyBooked) {
            throw new ApiException(
                    "You already have an active booking (PENDING or CONFIRMED) for this race",
                    HttpStatus.CONFLICT);
        }

        if (!"UPCOMING".equals(race.getStatus())) {
            throw new ApiException("Race is not available for booking. Status: " + race.getStatus(),
                    HttpStatus.BAD_REQUEST);
        }

        if (race.getRaceDate() != null && race.getRaceDate().isBefore(LocalDateTime.now())) {
            throw new ApiException("Cannot book tickets for an event that has already occurred.", HttpStatus.BAD_REQUEST);
        }

        // 2. Check available quota
        if (race.getAvailableQuota() < request.getQuantity()) {
            throw new ApiException(
                    "Insufficient quota. Available: " + race.getAvailableQuota() + ", Requested: "
                            + request.getQuantity(),
                    HttpStatus.BAD_REQUEST);
        }

        // 3. Generate unique booking code (format: APEX-XXXXXX)
        String bookingCode = generateUniqueBookingCode();

        // 4. Determine zone and calculate total price on the backend
        String zone = (request.getZone() != null) ? request.getZone().toUpperCase() : "GA";
        double multiplier = ZONE_MULTIPLIERS.getOrDefault(zone, 1.0);
        BigDecimal totalPrice = race.getTicketPrice()
                .multiply(BigDecimal.valueOf(multiplier))
                .multiply(BigDecimal.valueOf(request.getQuantity()));

        // 5. Save booking with PENDING status
        // NOTE: PostgreSQL trigger will:
        // - Set expired_at = created_at + 30 minutes (on INSERT)
        // - Reduce available_quota when status changes to CONFIRMED
        // - Restore available_quota when status changes to CANCELLED
        Booking booking = Booking.builder()
                .bookingCode(bookingCode)
                .userId(userId)
                .userEmail(userEmail)
                .username(username)
                .userFullName(userFullName)
                .race(race)
                .quantity(request.getQuantity())
                .zone(zone)
                .totalPrice(totalPrice)
                .status("PENDING")
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // 6. Send async email confirmation
        emailService.sendBookingConfirmation(savedBooking, userEmail);

        log.info("Booking created: {} for userId: {} — raceId: {}", bookingCode, userId, race.getId());
        return mapToBookingResponse(savedBooking);
    }

    @Override
    public Page<BookingResponse> getUserBookings(Integer userId, int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        // M-03 Fix: support optional status filter for accurate per-status count
        String statusFilter = (status != null && !status.isBlank()) ? status.toUpperCase() : "ALL";
        return bookingRepository.findByUserIdWithRaceAndStatus(userId, statusFilter, pageable)
                .map(this::mapToBookingResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingByCode(String code) {
        Booking booking = bookingRepository.findByBookingCode(code)
                .orElseThrow(() -> new ApiException("Booking not found with code: " + code, HttpStatus.NOT_FOUND));
        return mapToBookingResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse confirmBooking(Integer bookingId, Integer requestingUserId) {
        Booking booking = bookingRepository.findByIdWithRace(bookingId)
                .orElseThrow(() -> new ApiException("Booking not found with id: " + bookingId, HttpStatus.NOT_FOUND));

        // Security fix: only the booking owner can confirm
        if (!booking.getUserId().equals(requestingUserId)) {
            throw new ApiException("You are not authorized to confirm this booking", HttpStatus.FORBIDDEN);
        }

        if (!"PENDING".equals(booking.getStatus())) {
            throw new ApiException("Only PENDING bookings can be confirmed. Current status: " + booking.getStatus(),
                    HttpStatus.BAD_REQUEST);
        }

        // Check if expired
        if (booking.getExpiredAt() != null && LocalDateTime.now().isAfter(booking.getExpiredAt())) {
            throw new ApiException("Booking has expired and cannot be confirmed", HttpStatus.BAD_REQUEST);
        }

        // Lock the race for update to prevent quota race conditions
        Race race = raceRepository.findByIdWithCircuitForUpdate(booking.getRace().getId())
                .orElseThrow(() -> new ApiException("Race not found for booking", HttpStatus.NOT_FOUND));

        // Verify sufficient quota before confirming
        if (race.getAvailableQuota() < booking.getQuantity()) {
            throw new ApiException(
                    "Insufficient quota to confirm booking. Available: " + race.getAvailableQuota()
                            + ", Requested: " + booking.getQuantity(),
                    HttpStatus.BAD_REQUEST);
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
    public BookingResponse cancelBooking(Integer bookingId, String reason, Integer requestingUserId, String userEmail) {
        Booking booking = bookingRepository.findByIdWithRaceForUpdate(bookingId)
                .orElseThrow(() -> new ApiException("Booking not found with id: " + bookingId, HttpStatus.NOT_FOUND));

        // Security fix: only the booking owner can cancel
        if (!booking.getUserId().equals(requestingUserId)) {
            throw new ApiException("You are not authorized to cancel this booking", HttpStatus.FORBIDDEN);
        }

        if ("CANCELLED".equals(booking.getStatus())) {
            // Idempotent: return existing cancellation instead of throwing error if it's already cancelled
            return mapToBookingResponse(booking);
        }

        // B-03 & B-04 Fix: Block illegal transitions, only PENDING or CONFIRMED can be cancelled
        if (!"PENDING".equals(booking.getStatus()) && !"CONFIRMED".equals(booking.getStatus())) {
            throw new ApiException("Cannot cancel booking from status: " + booking.getStatus(), HttpStatus.BAD_REQUEST);
        }

        // B-04 Fix: prevent cancelling a ticket that has already been scanned/used at the venue
        if (booking.getScannedAt() != null) {
            throw new ApiException(
                    "Cannot cancel a booking that has already been scanned and used at the venue",
                    HttpStatus.BAD_REQUEST);
        }

        booking.setStatus("CANCELLED");
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancellationReason(reason != null ? reason : "Cancelled by user");

        // PostgreSQL trigger (trg_update_quota) will:
        // CANCELLED from PENDING → restore available_quota
        // CANCELLED from CONFIRMED → restore available_quota
        Booking cancelled = bookingRepository.save(booking);

        // Send async cancellation email
        emailService.sendBookingCancellation(cancelled, userEmail);

        log.info("Booking cancelled: {} — reason: {}", cancelled.getBookingCode(), reason);
        return mapToBookingResponse(cancelled);
    }

    @Override
    @Transactional
    public BookingResponse scanBooking(String bookingCode) {
        Booking booking = bookingRepository.findByBookingCodeForUpdate(bookingCode)
                .orElseThrow(() -> new ApiException("Invalid QR Code: Booking not found with code " + bookingCode, HttpStatus.NOT_FOUND));

        if ("USED".equals(booking.getStatus())) {
            // Idempotency check / Re-scan rejection
            throw new ApiException("Ticket has already been used.", HttpStatus.BAD_REQUEST);
        }

        if (!"CONFIRMED".equals(booking.getStatus())) {
            throw new ApiException("Ticket is invalid. Booking status is: " + booking.getStatus(), HttpStatus.BAD_REQUEST);
        }

        if (booking.getScannedAt() != null) {
            throw new ApiException("Ticket has already been scanned on " + booking.getScannedAt(), HttpStatus.BAD_REQUEST);
        }

        // Mark as scanned and transition status to USED
        booking.setScannedAt(LocalDateTime.now());
        booking.setStatus("USED");
        Booking scanned = bookingRepository.save(booking);

        log.info("Ticket successfully scanned and verified: {}", scanned.getBookingCode());
        return mapToBookingResponse(scanned);
    }

    private String generateUniqueBookingCode() {
        // B-09 Fix: Use UUID to prevent collision and avoid N+1 DB queries
        return "APEX-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
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
                .userEmail(booking.getUserEmail())
                .username(booking.getUsername())
                .userFullName(booking.getUserFullName())
                .raceId(race != null ? race.getId() : null)
                .raceName(race != null ? race.getName() : null)
                .circuitName(circuitName)
                .country(country)
                .raceDate(race != null ? race.getRaceDate() : null)
                .quantity(booking.getQuantity())
                .zone(booking.getZone() != null ? booking.getZone() : "GA")
                .totalPrice(booking.getTotalPrice())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .expiredAt(booking.getExpiredAt())
                .confirmedAt(booking.getConfirmedAt())
                .cancelledAt(booking.getCancelledAt())
                .scannedAt(booking.getScannedAt())
                .cancellationReason(booking.getCancellationReason())
                .hasTicket("CONFIRMED".equals(booking.getStatus()))
                .build();
    }
    // Admin: paginated view of all bookings with optional filters
    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(String status, Integer raceId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String statusFilter = (status != null && !status.isBlank()) ? status.toUpperCase() : "ALL";
        Integer raceIdFilter = (raceId != null) ? raceId : -1;
        return bookingRepository.findAllWithFilters(statusFilter, raceIdFilter, pageRequest)
                .map(this::mapToBookingResponse);
    }

    // Admin: force cancel any booking regardless of ownership
    @Override
    @Transactional
    public BookingResponse adminCancelBooking(Integer bookingId, String reason) {
        Booking booking = bookingRepository.findByIdWithRaceForUpdate(bookingId)
                .orElseThrow(() -> new ApiException("Booking not found", HttpStatus.NOT_FOUND));

        if ("CANCELLED".equals(booking.getStatus())) {
            return mapToBookingResponse(booking);
        }

        // Only allow cancel from PENDING or CONFIRMED
        if (!"PENDING".equals(booking.getStatus()) && !"CONFIRMED".equals(booking.getStatus())) {
            throw new ApiException("Cannot cancel booking from status: " + booking.getStatus(), HttpStatus.BAD_REQUEST);
        }

        booking.setStatus("CANCELLED");
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancellationReason(reason != null ? reason : "Cancelled by administrator");
        Booking cancelled = bookingRepository.save(booking);

        // FIX: Notify user of administrative cancellation
        emailService.sendBookingCancellation(cancelled, cancelled.getUserEmail());

        log.info("Admin cancelled booking: {}", cancelled.getBookingCode());
        return mapToBookingResponse(cancelled);
    }
}
