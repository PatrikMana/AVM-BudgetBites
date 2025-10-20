package com.example.budgetbites;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendVerificationCode(String toEmail, String verificationCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("BudgetBites - Ověření registrace");
        message.setText("Váš ověřovací kód je: " + verificationCode + 
                       "\n\nTento kód je platný po dobu 10 minut." +
                       "\n\nBudgetBites Team");
        message.setFrom("noreply@budgetbites.com");
        
        mailSender.send(message);
    }
}