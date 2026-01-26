package com.example.budgetbites.exception;

import java.time.Instant;
import java.util.List;

/**
 * DTO pro standardizovanou chybovou odpověď API.
 */
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<ApiFieldError> fieldErrors
) {}
