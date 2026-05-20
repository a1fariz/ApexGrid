package com.apexgrid.raceservice.ticket;

import com.apexgrid.raceservice.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/{id}/ticket")
    public ResponseEntity<byte[]> downloadTicket(@PathVariable("id") Integer id,
                                                  HttpServletRequest request) {
        // Get user info from JWT (set by JwtAuthenticationFilter)
        String holderName = (String) request.getAttribute("fullName");
        if (holderName == null) {
            holderName = (String) request.getAttribute("username");
        }
        if (holderName == null) {
            holderName = "ApexGrid User";
        }

        byte[] pdfBytes = ticketService.generateTicket(id, holderName);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "ApexGrid-Ticket-" + id + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
