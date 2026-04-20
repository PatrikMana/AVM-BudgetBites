package com.example.budgetbites.auth.dto.response;

/**
 * DTO pro odpověď s JWT tokenem po úspěšném přihlášení.
 */
public record JwtResponse(String token) {}
