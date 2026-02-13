package com.example.budgetbites.dto.response;

/**
 * DTO pro veřejnou reprezentaci uživatele (bez citlivých údajů).
 */
public record UserResponse(Long id, String username, String email) {}
