package com.example.budgetbites.auth.repository;

import com.example.budgetbites.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findTopByTokenHashOrderByIdDesc(String tokenHash);
    void deleteByExpiresAtBefore(LocalDateTime time);
}