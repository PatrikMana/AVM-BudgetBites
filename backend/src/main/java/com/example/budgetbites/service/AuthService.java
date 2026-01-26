package com.example.budgetbites.service;

import com.example.budgetbites.domain.entity.User;
import com.example.budgetbites.domain.repository.UserRepository;
import com.example.budgetbites.dto.response.VerificationStatusResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Služba pro autentizaci a registraci uživatelů.
 * Spravuje registraci, přihlášení, verifikaci emailu a odesílání verifikačních kódů.
 */
@Service
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final int MAX_VERIFY_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int RESEND_WINDOW_MINUTES = 60;
    private static final int MAX_RESENDS_PER_WINDOW = 5;
    private static final int LOCK_MINUTES = 15;
    
    private static final SecureRandom secureRandom = new SecureRandom();
    
    @Autowired
    private EmailService emailService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registrace nového uživatele s emailovou verifikací.
     */
    public String registerWithEmailVerification(String username, String email, String password) {
        String normEmail = normalizeEmail(email);

        if (userRepository.findByUsername(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Uživatel s tímto jménem již existuje");
        }

        Optional<User> existingByEmail = userRepository.findByEmail(normEmail);
        if (existingByEmail.isPresent()) {
            User existing = existingByEmail.get();

            if (existing.isEmailVerified()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Uživatel s tímto emailem již existuje");
            }

            // Existuje, ale není ověřený -> pošleme nový kód
            assertResendAllowed(existing);

            String oldCode = existing.getVerificationCode();
            LocalDateTime oldExpiry = existing.getVerificationCodeExpiry();

            String newCode = generateVerificationCode();
            existing.setVerificationCode(newCode);
            existing.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));

            existing.setVerificationAttempts(0);
            existing.setVerificationLockedUntil(null);
            existing.setLastVerificationSentAt(LocalDateTime.now());

            userRepository.save(existing);

            try {
                emailService.sendVerificationCode(normEmail, newCode);
                return "Účet s tímto emailem už existuje, poslali jsme nový ověřovací kód.";
            } catch (Exception e) {
                existing.setVerificationCode(oldCode);
                existing.setVerificationCodeExpiry(oldExpiry);
                userRepository.save(existing);
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nepodařilo se odeslat ověřovací email");
            }
        }

        // Vytvoření nového uživatele
        String verificationCode = generateVerificationCode();
        String hashedPassword = passwordEncoder.encode(password);

        User user = new User();
        user.setUsername(username);
        user.setEmail(normEmail);
        user.setPassword(hashedPassword);
        user.setVerificationCode(verificationCode);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));
        user.setEmailVerified(false);

        userRepository.save(user);

        try {
            emailService.sendVerificationCode(normEmail, verificationCode);
            return "Na váš email byl odeslán ověřovací kód";
        } catch (Exception e) {
            userRepository.delete(user);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nepodařilo se odeslat ověřovací email");
        }
    }

    /**
     * Verifikace emailu pomocí kódu.
     */
    public String verifyEmail(String email, String verificationCode) {
        String normEmail = normalizeEmail(email);
        Optional<User> userOpt = userRepository.findByEmail(normEmail);

        if (userOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Uživatel nenalezen");
        }
        
        User user = userOpt.get();
        
        if (user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email již byl ověřen");
        }
        
        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(verificationCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Neplatný ověřovací kód");
        }
        
        if (user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ověřovací kód vypršel");
        }
        
        // Ověření úspěšné
        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);
        
        return "Email byl úspěšně ověřen. Můžete se přihlásit.";
    }

    /**
     * Přihlášení uživatele.
     */
    public boolean login(String username, String password) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            User foundUser = user.get();
            // Kontrola, zda je email ověřený
            if (!foundUser.isEmailVerified()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email nebyl ověřen. Nejdříve ověřte svůj email.");
            }
            return passwordEncoder.matches(password, foundUser.getPassword());
        }
        return false;
    }

    /**
     * Opětovné zaslání verifikačního kódu.
     */
    public String resendVerificationCode(String email) {
        String normEmail = normalizeEmail(email);

        User user = userRepository.findByEmail(normEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Uživatel nenalezen"));

        if (user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email již byl ověřen");
        }

        assertResendAllowed(user);

        String oldCode = user.getVerificationCode();
        LocalDateTime oldExpiry = user.getVerificationCodeExpiry();

        String newCode = generateVerificationCode();
        user.setVerificationCode(newCode);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));

        user.setVerificationAttempts(0);
        user.setVerificationLockedUntil(null);
        user.setLastVerificationSentAt(LocalDateTime.now());

        userRepository.save(user);

        try {
            emailService.sendVerificationCode(normEmail, newCode);
            return "Ověřovací kód byl znovu odeslán";
        } catch (Exception e) {
            user.setVerificationCode(oldCode);
            user.setVerificationCodeExpiry(oldExpiry);
            userRepository.save(user);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nepodařilo se odeslat ověřovací email");
        }
    }

    /**
     * Získání stavu verifikace pro daný email.
     */
    public VerificationStatusResponse getVerificationStatus(String email) {
        String normEmail = normalizeEmail(email);

        Optional<User> userOpt = userRepository.findByEmail(normEmail);
        if (userOpt.isEmpty()) {
            return new VerificationStatusResponse("NOT_FOUND", normEmail, null);
        }

        User user = userOpt.get();

        if (user.isEmailVerified()) {
            return new VerificationStatusResponse("VERIFIED", normEmail, null);
        }

        LocalDateTime exp = user.getVerificationCodeExpiry();
        if (exp == null) {
            return new VerificationStatusResponse("EXPIRED", normEmail, null);
        }

        if (exp.isBefore(LocalDateTime.now())) {
            return new VerificationStatusResponse("EXPIRED", normEmail, exp.toString());
        }

        return new VerificationStatusResponse("PENDING", normEmail, exp.toString());
    }

    /**
     * Jednoduchá registrace bez emailové verifikace (pro zpětnou kompatibilitu).
     */
    public void register(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Uživatel již existuje");
        }
        String hashedPassword = passwordEncoder.encode(password);
        User user = new User();
        user.setUsername(username);
        user.setPassword(hashedPassword);
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    // === Private helper methods ===

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private void assertResendAllowed(User user) {
        LocalDateTime now = LocalDateTime.now();

        // Cooldown
        if (user.getLastVerificationSentAt() != null &&
                user.getLastVerificationSentAt().isAfter(now.minusSeconds(RESEND_COOLDOWN_SECONDS))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Ověřovací kód byl odeslán nedávno. Zkuste to prosím za chvíli.");
        }

        // Rolling window (např. 5 resendů za 60 minut)
        LocalDateTime windowStart = user.getResendWindowStart();
        if (windowStart == null || windowStart.isBefore(now.minusMinutes(RESEND_WINDOW_MINUTES))) {
            user.setResendWindowStart(now);
            user.setResendCountInWindow(0);
        }

        if (user.getResendCountInWindow() >= MAX_RESENDS_PER_WINDOW) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Příliš mnoho požadavků na odeslání kódu. Zkuste to později.");
        }

        user.setResendCountInWindow(user.getResendCountInWindow() + 1);
    }

    private String generateVerificationCode() {
        int code = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(code);
    }
}
