package com.example.budgetbites.common.exception;

/**
 * DTO pro detail chybového pole při validaci.
 */
public record ApiFieldError(String field, String message) {}
