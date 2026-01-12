package com.example.budgetbites;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ResendVerificationRequest {
    @NotBlank(message = "email je povinný")
    @Email(message = "email nemá správný formát")
    private String email;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}