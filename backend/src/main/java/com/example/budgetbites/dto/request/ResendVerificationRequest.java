package com.example.budgetbites.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO pro opětovné zaslání verifikačního kódu.
 */
public class ResendVerificationRequest {
    
    @NotBlank(message = "email je povinný")
    @Email(message = "email nemá správný formát")
    private String email;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
