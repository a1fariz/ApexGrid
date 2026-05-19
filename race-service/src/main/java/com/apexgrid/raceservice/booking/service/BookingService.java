package com.apexgrid.raceservice.booking.service;

import com.apexgrid.raceservice.booking.dto.BookingRequest;
import com.apexgrid.raceservice.booking.dto.BookingResponse;

import java.util.List;

public interface BookingService {
    BookingResponse createBooking(BookingRequest request, Integer userId);
    List<BookingResponse> getUserBookings(Integer userId);
    BookingResponse getBookingByCode(String code);
    BookingResponse confirmBooking(Integer bookingId);
    BookingResponse cancelBooking(Integer bookingId, String reason);
}
