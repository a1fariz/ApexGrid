package com.apexgrid.userservice.service;

import com.apexgrid.userservice.entity.User;
import com.apexgrid.userservice.entity.VerificationToken;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@apexgrid.com}")
    private String fromEmail;

    @Async
    public void sendVerificationEmail(User user, VerificationToken token) {
        String subject = "Verify your ApexGrid Account";
        String verificationUrl = "http://localhost:5173/verify?token=" + token.getToken();

        String htmlBody = """
            <!DOCTYPE html>
            <html>
            <head><style>
              body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
              .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
              .header { background: #E10600; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
              .content { padding: 30px; text-align: center; }
              .btn { display: inline-block; background: #E10600; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
              .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style></head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🏎️ APEXGRID</h1>
                  <p style="margin:0;opacity:0.9">Welcome to the Club</p>
                </div>
                <div class="content">
                  <h2>Verify Your Email</h2>
                  <p>Hi %s,</p>
                  <p>Thanks for registering with ApexGrid! Please click the button below to verify your email address and activate your account.</p>
                  <a href="%s" class="btn">Verify My Account</a>
                  <p style="color:#aaa;font-size:14px;margin-top:20px;">Or copy and paste this link in your browser:<br/>
                  <a href="%s" style="color:#E10600;">%s</a></p>
                  <p style="color:#aaa;font-size:14px;">This link will expire in 24 hours.</p>
                </div>
                <div class="footer">
                  <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(user.getFullName(), verificationUrl, verificationUrl, verificationUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            
            mailSender.send(message);
            log.info("Verification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage());
            log.info("=========================================================");
            log.info("DEVELOPMENT MODE: Use this link to verify your account:");
            log.info(verificationUrl);
            log.info("=========================================================");
        }
    }
}
