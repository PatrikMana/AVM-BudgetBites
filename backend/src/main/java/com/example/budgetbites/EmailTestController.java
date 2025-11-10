package com.example.budgetbites;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/test")
public class EmailTestController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/email")
    public ResponseEntity<String> testEmail(@RequestParam String email) {
        try {
            emailService.sendVerificationCode(email, "123456");
            return ResponseEntity.ok("Email byl úspěšně odeslán na adresu: " + email);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Chyba při odesílání emailu: " + e.getMessage());
        }
    }
}
