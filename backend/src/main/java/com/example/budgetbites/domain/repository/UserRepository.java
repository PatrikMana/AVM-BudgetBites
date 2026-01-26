package com.example.budgetbites.domain.repository;

import com.example.budgetbites.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository pro práci s entitou User.
 * Poskytuje standardní CRUD operace a vlastní dotazy pro vyhledávání uživatelů.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Najde uživatele podle uživatelského jména.
     */
    Optional<User> findByUsername(String username);
    
    /**
     * Najde uživatele podle emailové adresy.
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Najde všechny neověřené uživatele, jejichž verifikační kód vypršel před zadaným časem.
     * Používá se pro čištění starých neověřených účtů.
     */
    List<User> findByEmailVerifiedFalseAndVerificationCodeExpiryBefore(LocalDateTime time);
}
