package com.apexgrid.raceservice.booking.controller;

import com.apexgrid.raceservice.booking.dto.BookingRequest;
import com.apexgrid.raceservice.booking.dto.BookingResponse;
import com.apexgrid.raceservice.booking.service.BookingService;
import com.apexgrid.raceservice.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request, userId));
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getUserBookings(HttpServletRequest httpRequest) {
        Integer userId = extractUserId(httpRequest);
        return ResponseEntity.ok(bookingService.getUserBookings(userId));
    }

    @GetMapping("/{code}")
    public ResponseEntity<BookingResponse> getBookingByCode(@PathVariable("code") String code) {
        return ResponseEntity.ok(bookingService.getBookingByCode(code));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<BookingResponse> confirmBooking(@PathVariable("id") Integer id,
                                                          HttpServletRequest httpRequest) {
        Integer userId = extractUserId(httpRequest);
        return ResponseEntity.ok(bookingService.confirmBooking(id, userId));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable("id") Integer id,
                                                          @RequestBody(required = false) Map<String, String> body,
                                                          HttpServletRequest httpRequest) {
        Integer userId = extractUserId(httpRequest);
        String reason = body != null ? body.get("reason") : "Cancelled by user";
        return ResponseEntity.ok(bookingService.cancelBooking(id, reason, userId));
    }

    private Integer extractUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        if (userId == null) {
            throw new ApiException("User not authenticated", HttpStatus.UNAUTHORIZED);
        }
        return (Integer) userId;
    }
}
