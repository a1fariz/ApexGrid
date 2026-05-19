package com.apexgrid.raceservice.email;

import com.apexgrid.raceservice.booking.entity.Booking;

public interface EmailService {
    void sendBookingConfirmation(Booking booking, String userEmail);
    void sendBookingCancellation(Booking booking, String userEmail);
}
