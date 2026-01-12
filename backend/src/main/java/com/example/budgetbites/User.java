package com.example.budgetbites;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    @Column(unique = true)
    private String email;

    private String password;

    private String verificationCode;

    private LocalDateTime verificationCodeExpiry;

    private boolean emailVerified = false;

    public Long getId() {
        return id;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

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

    public LocalDateTime getVerificationCodeExpiry() {
        return verificationCodeExpiry;
    }

    public void setVerificationCodeExpiry(LocalDateTime verificationCodeExpiry) {
        this.verificationCodeExpiry = verificationCodeExpiry;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    private int verificationAttempts = 0;

    private LocalDateTime verificationLockedUntil;

    private LocalDateTime lastVerificationSentAt;

    private int resendCountInWindow = 0;
    private LocalDateTime resendWindowStart;

    public int getVerificationAttempts() {
        return verificationAttempts;
    }

    public void setVerificationAttempts(int verificationAttempts) {
        this.verificationAttempts = verificationAttempts;
    }

    public LocalDateTime getVerificationLockedUntil() {
        return verificationLockedUntil;
    }

    public void setVerificationLockedUntil(LocalDateTime verificationLockedUntil) {
        this.verificationLockedUntil = verificationLockedUntil;
    }

    public LocalDateTime getLastVerificationSentAt() {
        return lastVerificationSentAt;
    }

    public void setLastVerificationSentAt(LocalDateTime lastVerificationSentAt) {
        this.lastVerificationSentAt = lastVerificationSentAt;
    }

    public int getResendCountInWindow() {
        return resendCountInWindow;
    }

    public void setResendCountInWindow(int resendCountInWindow) {
        this.resendCountInWindow = resendCountInWindow;
    }

    public LocalDateTime getResendWindowStart() {
        return resendWindowStart;
    }

    public void setResendWindowStart(LocalDateTime resendWindowStart) {
        this.resendWindowStart = resendWindowStart;
    }
}