package com.apexgrid.userservice.service;

import com.apexgrid.userservice.entity.PasswordResetToken;
import com.apexgrid.userservice.entity.User;
import com.apexgrid.userservice.entity.VerificationToken;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserEmailService {

    private final JavaMailSender mailSender;
    private final Environment env;

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

    public void sendPasswordResetEmail(User user, PasswordResetToken resetToken) {
        String subject = "Reset Your ApexGrid Password";
        String resetUrl = "http://localhost:5173/reset-password?token=" + resetToken.getToken();

        String name = (user.getFullName() != null && !user.getFullName().isBlank())
                ? user.getFullName() : user.getUsername();

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
                  <p style="margin:0;opacity:0.9">Password Reset Request</p>
                </div>
                <div class="content">
                  <h2>Reset Your Password</h2>
                  <p>Hi %s,</p>
                  <p>We received a request to reset your ApexGrid password. Click the button below to create a new password.</p>
                  <a href="%s" class="btn">Reset My Password</a>
                  <p style="color:#aaa;font-size:14px;margin-top:20px;">Or copy and paste this link in your browser:<br/>
                  <a href="%s" style="color:#E10600;">%s</a></p>
                  <p style="color:#aaa;font-size:14px;">This link will expire in <strong>1 hour</strong>.</p>
                  <p style="color:#aaa;font-size:14px;">If you did not request a password reset, you can safely ignore this email. Your account is safe.</p>
                </div>
                <div class="footer">
                  <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, resetUrl, resetUrl, resetUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Password reset email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", user.getEmail(), e.getMessage());
            
            boolean isDevMode = java.util.Arrays.asList(env.getActiveProfiles()).contains("dev") || 
                                java.util.Arrays.asList(env.getActiveProfiles()).contains("default") ||
                                env.getActiveProfiles().length == 0;

            if (isDevMode) {
                log.info("=========================================================");
                log.info("DEVELOPMENT MODE FALLBACK: Use this link to reset password:");
                log.info(resetUrl);
                log.info("=========================================================");
            } else {
                throw new com.apexgrid.userservice.exception.ApiException(
                    "Unable to send email, please try again later", 
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE
                );
            }
        }
    }
}
