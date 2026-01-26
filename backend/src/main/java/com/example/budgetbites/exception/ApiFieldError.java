package com.example.budgetbites.exception;

/**
 * DTO pro detail chybového pole při validaci.
 */
public record ApiFieldError(String field, String message) {}
