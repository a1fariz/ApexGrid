package com.apexgrid.raceservice.email;

import com.apexgrid.raceservice.booking.entity.Booking;
import com.apexgrid.raceservice.race.entity.Race;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;

import org.springframework.core.io.ByteArrayResource;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final EmailLogRepository emailLogRepository;

    @Value("${spring.mail.username:noreply@apexgrid.com}")
    private String fromEmail;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd MMMM yyyy, HH:mm");

    @Override
    @Async("emailTaskExecutor")
    public void sendBookingConfirmation(Booking booking, String userEmail) {
        Race race = booking.getRace();
        String recipient = userEmail != null ? userEmail : "user-" + booking.getUserId() + "@apexgrid.local";
        String subject = "🏎️ Booking Confirmed — " + booking.getBookingCode();

        String body = buildConfirmationEmailHtml(booking);

        EmailLog emailLog = EmailLog.builder()
                .recipientEmail(recipient)
                .subject(subject)
                .body(body)
                .emailType("BOOKING_CONFIRMATION")
                .booking(booking)
                .status("PENDING")
                .build();

        try {
            if (userEmail != null) {
                sendHtmlEmail(recipient, subject, body);
                emailLog.setStatus("SENT");
                log.info("Booking confirmation email sent to: {}", recipient);
            } else {
                emailLog.setStatus("SKIPPED");
                log.info("Booking confirmation logged (no user email available) for booking: {}", booking.getBookingCode());
            }
        } catch (Exception e) {
            emailLog.setStatus("FAILED");
            emailLog.setErrorMessage(e.getMessage());
            log.error("Failed to send booking confirmation email: {}", e.getMessage());
        } finally {
            emailLogRepository.save(emailLog);
        }
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendBookingCancellation(Booking booking, String userEmail) {
        String recipient = userEmail != null ? userEmail : "user-" + booking.getUserId() + "@apexgrid.local";
        String subject = "❌ Booking Cancelled — " + booking.getBookingCode();

        String body = buildCancellationEmailHtml(booking);

        EmailLog emailLog = EmailLog.builder()
                .recipientEmail(recipient)
                .subject(subject)
                .body(body)
                .emailType("BOOKING_CANCELLATION")
                .booking(booking)
                .status("PENDING")
                .build();

        try {
            if (userEmail != null) {
                sendHtmlEmail(recipient, subject, body);
                emailLog.setStatus("SENT");
                log.info("Cancellation email sent to: {}", recipient);
            } else {
                emailLog.setStatus("SKIPPED");
                log.info("Cancellation logged (no user email) for booking: {}", booking.getBookingCode());
            }
        } catch (Exception e) {
            emailLog.setStatus("FAILED");
            emailLog.setErrorMessage(e.getMessage());
            log.error("Failed to send cancellation email: {}", e.getMessage());
        } finally {
            emailLogRepository.save(emailLog);
        }
    }

    @Override
    @Async("emailTaskExecutor")
    public void sendTicketEmail(Booking booking, String userEmail, byte[] pdfTicket) {
        String recipient = userEmail != null ? userEmail : "user-" + booking.getUserId() + "@apexgrid.local";
        String subject = "🎫 Your F1 Ticket — " + booking.getBookingCode();
        String body = buildTicketEmailHtml(booking);

        EmailLog emailLog = EmailLog.builder()
                .recipientEmail(recipient)
                .subject(subject)
                .body(body)
                .emailType("TICKET_DELIVERY")
                .booking(booking)
                .status("PENDING")
                .build();

        try {
            if (userEmail != null && pdfTicket != null) {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(fromEmail);
                helper.setTo(recipient);
                helper.setSubject(subject);
                helper.setText(body, true);
                helper.addAttachment(
                        "ApexGrid-Ticket-" + booking.getBookingCode() + ".pdf",
                        new ByteArrayResource(pdfTicket),
                        "application/pdf"
                );
                mailSender.send(message);
                emailLog.setStatus("SENT");
                log.info("Ticket email with PDF sent to: {}", recipient);
            } else {
                emailLog.setStatus("SKIPPED");
                log.info("Ticket email logged (no email/pdf) for booking: {}", booking.getBookingCode());
            }
        } catch (Exception e) {
            emailLog.setStatus("FAILED");
            emailLog.setErrorMessage(e.getMessage());
            log.error("Failed to send ticket email: {}", e.getMessage());
        } finally {
            emailLogRepository.save(emailLog);
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }

    private String buildConfirmationEmailHtml(Booking booking) {
        Race race = booking.getRace();
        String circuitName = race != null && race.getCircuit() != null ? race.getCircuit().getName() : "N/A";
        String raceName = race != null ? race.getName() : "N/A";
        String raceDate = race != null && race.getRaceDate() != null ? race.getRaceDate().format(FORMATTER) : "N/A";

        return """
            <!DOCTYPE html>
            <html>
            <head><style>
              body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
              .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
              .header { background: #E10600; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
              .content { padding: 30px; }
              .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
              .info-table { width: 100%%; border-collapse: collapse; margin: 20px 0; }
              .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
              .info-table td:first-child { color: #aaa; width: 40%%; }
              .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style></head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🏎️ APEXGRID</h1>
                  <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
                </div>
                <div class="content">
                  <h2>Your Booking is Confirmed!</h2>
                  <div class="badge">PENDING CONFIRMATION</div>
                  <table class="info-table">
                    <tr><td>Booking Code</td><td><strong>%s</strong></td></tr>
                    <tr><td>Race</td><td>%s</td></tr>
                    <tr><td>Circuit</td><td>%s</td></tr>
                    <tr><td>Race Date</td><td>%s</td></tr>
                    <tr><td>Tickets</td><td>%d</td></tr>
                    <tr><td>Total Price</td><td><strong>$%s USD</strong></td></tr>
                    <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
                  </table>
                  <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
                </div>
                <div class="footer">
                  <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                booking.getBookingCode(),
                raceName,
                circuitName,
                raceDate,
                booking.getQuantity(),
                booking.getTotalPrice().toPlainString()
        );
    }

    private String buildCancellationEmailHtml(Booking booking) {
        Race race = booking.getRace();
        String raceName = race != null ? race.getName() : "N/A";

        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
              <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
                <div style="background:#333;padding:30px;text-align:center;">
                  <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
                </div>
                <div style="padding:30px;">
                  <h2>Booking Cancelled</h2>
                  <p>Your booking <strong>%s</strong> for <strong>%s</strong> has been cancelled.</p>
                  <p style="color:#aaa;">Reason: %s</p>
                  <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                booking.getBookingCode(),
                raceName,
                booking.getCancellationReason() != null ? booking.getCancellationReason() : "Expired"
        );
    }

    private String buildTicketEmailHtml(Booking booking) {
        Race race = booking.getRace();
        String raceName = race != null ? race.getName() : "N/A";
        String circuitName = race != null && race.getCircuit() != null ? race.getCircuit().getName() : "N/A";

        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
              <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
                <div style="background:#E10600;padding:30px;text-align:center;">
                  <h1 style="margin:0;font-size:28px;letter-spacing:2px;">🎫 APEXGRID</h1>
                  <p style="margin:5px 0 0;opacity:0.9;">Your F1 Ticket is Ready!</p>
                </div>
                <div style="padding:30px;">
                  <h2>Ticket Attached!</h2>
                  <p>Your ticket for <strong>%s</strong> at <strong>%s</strong> is attached to this email as a PDF.</p>
                  <p>Booking Code: <strong style="color:#E10600;font-size:18px;">%s</strong></p>
                  <p style="color:#aaa;font-size:14px;">Please present the attached PDF ticket (with QR Code) at the circuit gate on race day.</p>
                  <p style="color:#aaa;font-size:14px;">You can also download your ticket anytime from your profile on the ApexGrid website.</p>
                </div>
                <div style="background:#0f0f17;padding:20px;text-align:center;color:#666;font-size:12px;">
                  <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(raceName, circuitName, booking.getBookingCode());
    }
}
