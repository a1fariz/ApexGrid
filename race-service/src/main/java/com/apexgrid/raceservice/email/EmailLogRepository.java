package com.apexgrid.raceservice.email;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, Integer> {

    List<EmailLog> findByBookingId(Integer bookingId);

    List<EmailLog> findByStatus(String status);

    List<EmailLog> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);
}
