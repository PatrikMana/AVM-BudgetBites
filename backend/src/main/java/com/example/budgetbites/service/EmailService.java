package com.example.budgetbites.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Service for sending emails.
 * Handles sending verification codes and other system emails.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Sends a verification code to the specified email address.
     */
    public void sendVerificationCode(String toEmail, String verificationCode) {
        try {
            logger.info("Attempting to send email to: {}", toEmail);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("BudgetBites - Registration Verification");
            helper.setFrom(fromEmail);
            helper.setText(buildHtmlContent(verificationCode), true);

            logger.info("Sending email from: {} to: {}", fromEmail, toEmail);
            mailSender.send(mimeMessage);
            logger.info("Email successfully sent to: {}", toEmail);

        } catch (MessagingException e) {
            logger.error("Error sending email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send verification email: " + e.getMessage(), e);
        }
    }

    /**
     * Builds the HTML content for the verification email.
     */
    private String buildHtmlContent(String verificationCode) {
        return "<!doctype html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "  <meta charset=\"utf-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width\">\n" +
                "  <meta name=\"x-apple-disable-message-reformatting\">\n" +
                "  <meta http-equiv=\"x-ua-compatible\" content=\"ie=edge\">\n" +
                "  <title>Verification Code</title>\n" +
                "  <style>\n" +
                "    @media (max-width: 600px) {\n" +
                "      .container { width: 100% !important; }\n" +
                "      .px { padding-left: 16px !important; padding-right: 16px !important; }\n" +
                "      .h1 { font-size: 28px !important; line-height: 34px !important; }\n" +
                "    }\n" +
                "    @media (prefers-color-scheme: dark) {\n" +
                "      .bg { background-color: #0b0c0d !important; }\n" +
                "      .card { background-color: #111317 !important; }\n" +
                "      .muted { color:#cbd5e1 !important; }\n" +
                "      .text { color:#e5e7eb !important; }\n" +
                "    }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body style=\"margin:0; padding:0; background:#0b0c0d;\" class=\"bg\">\n" +
                "  <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background:#0b0c0d00;\">\n" +
                "    <tr>\n" +
                "      <td align=\"center\" style=\"padding:24px;\">\n" +
                "        <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" class=\"container\" style=\"width:600px; max-width:600px; background:#111317; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,.35);\">\n" +
                "          <tr>\n" +
                "            <td class=\"px\" style=\"padding:28px 32px; border-bottom:1px solid #23262b;\">\n" +
                "              <table role=\"presentation\" width=\"100%\">\n" +
                "                <tr>\n" +
                "                  <td align=\"left\">\n" +
                "                    <span style=\"display:inline-block; font-family:Arial,Helvetica,sans-serif; font-weight:700; font-size:18px; color:#22C55E;\">\n" +
                "                      BudgetBites\n" +
                "                    </span>\n" +
                "                  </td>\n" +
                "                  <td align=\"right\">\n" +
                "                    <span style=\"display:inline-block; font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#cbd5e1;\">\n" +
                "                      Security Verification\n" +
                "                    </span>\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "\n" +
                "          <tr>\n" +
                "            <td class=\"px\" style=\"padding:28px 32px;\">\n" +
                "              <h1 class=\"h1\" style=\"margin:0 0 12px; font-family:Arial,Helvetica,sans-serif; font-size:32px; line-height:38px; color:#e5e7eb;\">\n" +
                "                Your Verification Code\n" +
                "              </h1>\n" +
                "              <p class=\"text\" style=\"margin:0 0 20px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:22px; color:#e5e7eb;\">\n" +
                "                This code is valid for <strong>10 minutes</strong>.\n" +
                "              </p>\n" +
                "\n" +
                "              <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"margin:0 0 20px;\">\n" +
                "                <tr>\n" +
                "                  <td align=\"center\" style=\"\n" +
                "                    background:#0f172a; \n" +
                "                    border:1px solid #2a2f34; \n" +
                "                    border-radius:10px; \n" +
                "                    padding:16px;\">\n" +
                "                    <div style=\"font-family:Courier New,Consolas,monospace; font-size:28px; line-height:34px; letter-spacing:4px; color:#F59E0B;\">\n" +
                "                      " + verificationCode + "\n" +
                "                    </div>\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "\n" +
                "              <p class=\"muted\" style=\"margin:0 0 28px; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:20px; color:#9ca3af;\">\n" +
                "                If you did not request this code, you can ignore this email.\n" +
                "              </p>\n" +
                "\n" +
                "              <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" align=\"center\" style=\"margin:0 auto 10px;\">\n" +
                "                <tr>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "\n" +
                "              <p class=\"muted\" style=\"margin:18px 0 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:18px; color:#9ca3af;\">\n" +
                "                Thank you,<br> <strong style=\"color:#e5e7eb;\">BudgetBites Team</strong>\n" +
                "              </p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "\n" +
                "          <tr>\n" +
                "            <td style=\"padding:16px 32px; border-top:1px solid #23262b;\">\n" +
                "              <p class=\"muted\" style=\"margin:0; font-family:Arial,Helvetica,sans-serif; font-size:11px; line-height:16px; color:#94a3b8;\">\n" +
                "                This email was sent automatically, please do not reply.\n" +
                "              </p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "        </table>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </table>\n" +
                "</body>\n" +
                "</html>";
    }

    public void sendPasswordResetLink(String toEmail, String resetLink) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("BudgetBites - Set a New Password"); // nebo "Nastavení nového hesla"
            helper.setFrom(fromEmail);
            helper.setText(buildPasswordResetHtml(resetLink), true);

            mailSender.send(mimeMessage);
            logger.info("Password reset email sent to: {}", toEmail);
        } catch (Exception e) {
            logger.error("Error sending password reset email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send reset email: " + e.getMessage(), e);
        }
    }

    private String buildPasswordResetHtml(String resetLink) {
        return "<!doctype html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "  <meta charset=\"utf-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width\">\n" +
                "  <meta name=\"x-apple-disable-message-reformatting\">\n" +
                "  <meta http-equiv=\"x-ua-compatible\" content=\"ie=edge\">\n" +
                "  <title>Reset Your Password</title>\n" +
                "  <style>\n" +
                "    @media (max-width: 600px) {\n" +
                "      .container { width: 100% !important; }\n" +
                "      .px { padding-left: 16px !important; padding-right: 16px !important; }\n" +
                "      .h1 { font-size: 28px !important; line-height: 34px !important; }\n" +
                "    }\n" +
                "    @media (prefers-color-scheme: dark) {\n" +
                "      .bg { background-color: #0b0c0d !important; }\n" +
                "      .card { background-color: #111317 !important; }\n" +
                "      .muted { color:#cbd5e1 !important; }\n" +
                "      .text { color:#e5e7eb !important; }\n" +
                "    }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body style=\"margin:0; padding:0; background:#0b0c0d;\" class=\"bg\">\n" +
                "  <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background:#0b0c0d00;\">\n" +
                "    <tr>\n" +
                "      <td align=\"center\" style=\"padding:32px;\">\n" +
                "        <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" class=\"container\" style=\"width:600px; max-width:600px; background:#111317; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,.35);\">\n" +
                "          <tr>\n" +
                "            <td class=\"px\" style=\"padding:32px 40px; border-bottom:1px solid #23262b;\">\n" +
                "              <table role=\"presentation\" width=\"100%\">\n" +
                "                <tr>\n" +
                "                  <td align=\"left\">\n" +
                "                    <span style=\"display:inline-block; font-family:Arial,Helvetica,sans-serif; font-weight:700; font-size:18px; color:#22C55E;\">\n" +
                "                      BudgetBites\n" +
                "                    </span>\n" +
                "                  </td>\n" +
                "                  <td align=\"right\">\n" +
                "                    <span style=\"display:inline-block; font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#cbd5e1;\">\n" +
                "                      Password Reset\n" +
                "                    </span>\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "\n" +
                "          <tr>\n" +
                "            <td class=\"px\" style=\"padding:48px 40px;\">\n" +
                "              <h1 class=\"h1\" style=\"margin:0 0 24px; font-family:Arial,Helvetica,sans-serif; font-size:32px; line-height:38px; font-weight:700; color:#e5e7eb;\">\n" +
                "                Set A New Password\n" +
                "              </h1>\n" +
                "              \n" +
                "              <p class=\"text\" style=\"margin:0 0 36px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:24px; color:#cbd5e1;\">\n" +
                "                Click the link below to set a new password for your account.\n" +
                "              </p>\n" +
                "\n" +
                "              <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" align=\"center\" style=\"margin:0 auto 36px;\">\n" +
                "                <tr>\n" +
                "                  <td align=\"center\" style=\"border-radius:8px; background:#22C55E;\">\n" +
                "                    <a href=\"" + resetLink + "\" style=\"\n" +
                "                      display:inline-block;\n" +
                "                      padding:16px 48px;\n" +
                "                      font-family:Arial,Helvetica,sans-serif;\n" +
                "                      font-size:16px;\n" +
                "                      font-weight:600;\n" +
                "                      color:#ffffff;\n" +
                "                      text-decoration:none;\n" +
                "                      border-radius:8px;\n" +
                "                      text-transform:uppercase;\n" +
                "                      letter-spacing:0.5px;\">\n" +
                "                      Reset Password\n" +
                "                    </a>\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "\n" +
                "              <p class=\"text\" style=\"margin:0 0 28px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:24px; color:#cbd5e1;\">\n" +
                "                This link expires in 10 minutes. If you did not initiate this request, please ignore this email.\n" +
                "              </p>\n" +
                "\n" +
                "              <p class=\"muted\" style=\"margin:0; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:20px; color:#9ca3af;\">\n" +
                "                Thank you,<br>\n" +
                "                <span style=\"color:#cbd5e1;\">BudgetBites Team</span>\n" +
                "              </p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "\n" +
                "          <tr>\n" +
                "            <td style=\"padding:20px 40px; border-top:1px solid #23262b;\">\n" +
                "              <p class=\"muted\" style=\"margin:0; font-family:Arial,Helvetica,sans-serif; font-size:11px; line-height:16px; color:#94a3b8;\">\n" +
                "                © BudgetBites • This is an automated message\n" +
                "              </p>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "        </table>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </table>\n" +
                "</body>\n" +
                "</html>";
    }
}
