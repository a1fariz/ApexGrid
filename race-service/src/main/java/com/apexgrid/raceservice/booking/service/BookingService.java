package com.apexgrid.raceservice.booking.service;

import com.apexgrid.raceservice.booking.dto.BookingRequest;
import com.apexgrid.raceservice.booking.dto.BookingResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface BookingService {
    BookingResponse createBooking(BookingRequest request, Integer userId, String userEmail, String username, String userFullName);
    Page<BookingResponse> getUserBookings(Integer userId, int page, int size, String status);
    BookingResponse getBookingByCode(String code);
    BookingResponse confirmBooking(Integer bookingId, Integer requestingUserId);
    BookingResponse cancelBooking(Integer bookingId, String reason, Integer requestingUserId, String userEmail);
    BookingResponse scanBooking(String bookingCode);
    // Admin features
    Page<BookingResponse> getAllBookings(String status, Integer raceId, int page, int size);
    BookingResponse adminCancelBooking(Integer bookingId, String reason);
}
