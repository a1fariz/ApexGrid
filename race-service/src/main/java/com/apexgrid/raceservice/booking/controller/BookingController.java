package com.apexgrid.raceservice.booking.controller;

import com.apexgrid.raceservice.booking.dto.BookingRequest;
import com.apexgrid.raceservice.booking.dto.BookingResponse;
import com.apexgrid.raceservice.booking.service.BookingService;
import com.apexgrid.raceservice.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request,
                                                          HttpServletRequest httpRequest) {
        Integer userId = extractUserId(httpRequest);
        String userEmail = (String) httpRequest.getAttribute("userEmail");
        String username = (String) httpRequest.getAttribute("username");
        String userFullName = (String) httpRequest.getAttribute("fullName");
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request, userId, userEmail, username, userFullName));
    }

    @GetMapping
    public ResponseEntity<Page<BookingResponse>> getUserBookings(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "status", required = false) String status,
            HttpServletRequest httpRequest) {
        Integer userId = extractUserId(httpRequest);
        return ResponseEntity.ok(bookingService.getUserBookings(userId, page, size, status));
    }

    @GetMapping("/{code}")
    public ResponseEntity<BookingResponse> getBookingByCode(@PathVariable(name = "code") String code,
                                                             HttpServletRequest httpRequest) {
        // Security: verify that the requesting user owns this booking (or is admin)
        Integer requestingUserId = (Integer) httpRequest.getAttribute("userId");
        String role = (String) httpRequest.getAttribute("userRole");
        BookingResponse booking = bookingService.getBookingByCode(code);
        boolean isAdmin = "ADMIN".equals(role);
        if (!isAdmin && !booking.getUserId().equals(requestingUserId)) {
            throw new ApiException("You are not authorized to view this booking", HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<BookingResponse> confirmBooking(@PathVariable(name = "id") Integer id,
                                                          HttpServletRequest httpRequest) {
        Integer userId = extractUserId(httpRequest);
        return ResponseEntity.ok(bookingService.confirmBooking(id, userId));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable(name = "id") Integer id,
                                                          @RequestBody(required = false) Map<String, String> body,
                                                          HttpServletRequest httpRequest) {
        Integer userId = extractUserId(httpRequest);
        String userEmail = (String) httpRequest.getAttribute("userEmail");
        String reason = body != null ? body.get("reason") : "Cancelled by user";
        return ResponseEntity.ok(bookingService.cancelBooking(id, reason, userId, userEmail));
    }

    // B-05 Fix: scan is now ADMIN-only (enforced via SecurityConfig rule ordering)
    @PostMapping("/{code}/scan")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> scanBooking(@PathVariable(name = "code") String code) {
        return ResponseEntity.ok(bookingService.scanBooking(code));
    }

    // H. Check-in alias: PUT /{code}/checkin — same logic as /scan but accessible via PUT for QA/frontend usage
    @PutMapping("/{code}/checkin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> checkinBooking(@PathVariable(name = "code") String code) {
        return ResponseEntity.ok(bookingService.scanBooking(code));
    }

    // Missing feature: Admin endpoint — view all bookings with filter & pagination
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<BookingResponse>> getAllBookings(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "raceId", required = false) Integer raceId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(bookingService.getAllBookings(status, raceId, page, size));
    }

    // Missing feature: Admin endpoint — force cancel any booking
    @PutMapping("/admin/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> adminCancelBooking(
            @PathVariable(name = "id") Integer id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "Cancelled by administrator") : "Cancelled by administrator";
        return ResponseEntity.ok(bookingService.adminCancelBooking(id, reason));
    }

    private Integer extractUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        if (userId == null) {
            throw new ApiException("User not authenticated", HttpStatus.UNAUTHORIZED);
        }
        return (Integer) userId;
    }
}

