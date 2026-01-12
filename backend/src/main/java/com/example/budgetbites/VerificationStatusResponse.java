package com.example.budgetbites;

public record VerificationStatusResponse(
        String status,        // NOT_FOUND | VERIFIED | PENDING | EXPIRED
        String email,
        String expiresAt       // ISO string nebo null
) {}