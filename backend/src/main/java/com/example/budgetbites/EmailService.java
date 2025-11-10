package com.example.budgetbites;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendVerificationCode(String toEmail, String verificationCode) {
        try {
            logger.info("Pokouším se odeslat email na adresu: {}", toEmail);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("BudgetBites - Ověření registrace");
            message.setText("Váš ověřovací kód je: " + verificationCode +
                           "\n\nTento kód je platný po dobu 10 minut." +
                           "\n\nBudgetBites Team");
            message.setFrom(fromEmail);

            logger.info("Odesílám email z adresy: {} na adresu: {}", fromEmail, toEmail);
            mailSender.send(message);
            logger.info("Email byl úspěšně odeslán na adresu: {}", toEmail);

        } catch (Exception e) {
            logger.error("Chyba při odesílání emailu na adresu {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Nepodařilo se odeslat ověřovací email: " + e.getMessage(), e);
        }
    }
}
