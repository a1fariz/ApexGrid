package com.apexgrid.raceservice.booking.service;

import com.apexgrid.raceservice.booking.dto.BookingRequest;
import com.apexgrid.raceservice.booking.dto.BookingResponse;

import java.util.List;

public interface BookingService {
    BookingResponse createBooking(BookingRequest request, Integer userId, String userEmail);
    List<BookingResponse> getUserBookings(Integer userId);
    BookingResponse getBookingByCode(String code);
    BookingResponse confirmBooking(Integer bookingId, Integer requestingUserId);
    BookingResponse cancelBooking(Integer bookingId, String reason, Integer requestingUserId, String userEmail);
}
