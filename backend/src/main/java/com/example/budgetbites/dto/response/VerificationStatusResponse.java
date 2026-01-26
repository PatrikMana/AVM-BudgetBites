package com.example.budgetbites.dto.response;

/**
 * DTO pro stav verifikace emailu.
 * 
 * @param status Možné hodnoty: NOT_FOUND | VERIFIED | PENDING | EXPIRED
 * @param email Emailová adresa uživatele
 * @param expiresAt Čas expirace verifikačního kódu (ISO string nebo null)
 */
public record VerificationStatusResponse(
        String status,
        String email,
        String expiresAt
) {}
