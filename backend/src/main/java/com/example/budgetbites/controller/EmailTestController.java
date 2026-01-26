package com.example.budgetbites.controller;

import com.example.budgetbites.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller pro testování emailové služby.
 * Slouží pouze pro vývoj a testování.
 */
@RestController
@RequestMapping("/test")
public class EmailTestController {

    private static final Logger logger = LoggerFactory.getLogger(EmailTestController.class);

    @Autowired
    private EmailService emailService;

    /**
     * Odešle testovací email.
     * POST /test/email?email=...
     */
    @PostMapping("/email")
    public ResponseEntity<String> testEmail(@RequestParam String email) {
        logger.info("[TEST-EMAIL] requested to send test email to={}", email);
        try {
            emailService.sendVerificationCode(email, "123456");
            logger.info("[TEST-EMAIL] email send success to={}", email);
            return ResponseEntity.ok("Email byl úspěšně odeslán na adresu: " + email);
        } catch (Exception e) {
            logger.error("[TEST-EMAIL] error sending email to {}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(500).body("Chyba při odesílání emailu: " + e.getMessage());
        }
    }
}
