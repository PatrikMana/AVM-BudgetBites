package com.example.budgetbites.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO pro verifikaci emailu pomocí kódu.
 */
public class VerifyRequest {
    
    @NotBlank(message = "email je povinný")
    @Email(message = "email nemá správný formát")
    private String email;

    @NotBlank(message = "verificationCode je povinný")
    @Pattern(regexp = "^\\d{6}$", message = "verificationCode musí být 6 číslic")
    private String verificationCode;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getVerificationCode() {
        return verificationCode;
    }

    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }
}
