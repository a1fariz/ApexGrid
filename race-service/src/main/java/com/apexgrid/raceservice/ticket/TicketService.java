package com.apexgrid.raceservice.ticket;

import com.apexgrid.raceservice.booking.entity.Booking;
import com.apexgrid.raceservice.booking.repository.BookingRepository;
import com.apexgrid.raceservice.exception.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final BookingRepository bookingRepository;
    private final QrCodeGenerator qrCodeGenerator;
    private final PdfTicketGenerator pdfTicketGenerator;
    private final ObjectMapper objectMapper;

    /**
     * Generate PDF ticket for a confirmed booking
     * @param bookingId the booking ID
     * @param holderName the name of the ticket holder (from JWT)
     * @return PDF bytes
     */
    public byte[] generateTicket(Integer bookingId, String holderName, Integer requestingUserId, String role) {
        Booking booking = bookingRepository.findByIdWithRace(bookingId)
                .orElseThrow(() -> new ApiException("Booking not found with id: " + bookingId, HttpStatus.NOT_FOUND));

        // FIX: Verify that the requesting user owns this booking (or is admin) to prevent IDOR
        boolean isAdmin = "ADMIN".equals(role);
        if (!isAdmin && !booking.getUserId().equals(requestingUserId)) {
            throw new ApiException("You are not authorized to download this ticket", HttpStatus.FORBIDDEN);
        }

        if (!"CONFIRMED".equals(booking.getStatus())) {
            throw new ApiException("Only CONFIRMED bookings can generate tickets. Current status: " + booking.getStatus(),
                    HttpStatus.BAD_REQUEST);
        }

        try {
            // 1. Build QR Code data (JSON with unique booking info)
            Map<String, Object> qrData = new HashMap<>();
            qrData.put("bookingCode", booking.getBookingCode());
            qrData.put("bookingId", booking.getId());
            qrData.put("userId", booking.getUserId());
            qrData.put("raceId", booking.getRace().getId());
            qrData.put("raceName", booking.getRace().getName());
            qrData.put("quantity", booking.getQuantity());
            qrData.put("generatedAt", LocalDateTime.now().toString());

            String qrDataJson = objectMapper.writeValueAsString(qrData);

            // 2. Generate QR Code image
            byte[] qrCodeImage = qrCodeGenerator.generateQrCode(qrDataJson);

            // 3. Generate PDF ticket with embedded QR Code
            byte[] pdfTicket = pdfTicketGenerator.generateTicket(booking, holderName, qrCodeImage);


            log.info("Ticket generated for booking: {} — holder: {}", booking.getBookingCode(), holderName);
            return pdfTicket;

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to generate ticket for booking {}: {}", bookingId, e.getMessage(), e);
            throw new ApiException("Failed to generate ticket: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Generate ticket bytes without saving (for email attachment)
     */
    public byte[] generateTicketForEmail(Booking booking, String holderName) {
        try {
            Map<String, Object> qrData = new HashMap<>();
            qrData.put("bookingCode", booking.getBookingCode());
            qrData.put("bookingId", booking.getId());
            qrData.put("userId", booking.getUserId());
            qrData.put("raceId", booking.getRace().getId());
            qrData.put("raceName", booking.getRace().getName());
            qrData.put("quantity", booking.getQuantity());
            qrData.put("generatedAt", LocalDateTime.now().toString());

            String qrDataJson = objectMapper.writeValueAsString(qrData);
            byte[] qrCodeImage = qrCodeGenerator.generateQrCode(qrDataJson);
            return pdfTicketGenerator.generateTicket(booking, holderName, qrCodeImage);
        } catch (Exception e) {
            log.error("Failed to generate ticket for email: {}", e.getMessage(), e);
            return null;
        }
    }
}
