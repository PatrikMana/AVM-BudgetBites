package com.example.budgetbites;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    private EmailService emailService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public String registerWithEmailVerification(String username, String email, String password) {
        // Kontrola duplicitních údajů
        if (userRepository.findByUsername(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Uživatel s tímto jménem již existuje");
        }
        
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Uživatel s tímto emailem již existuje");
        }

        // Generování 6místného kódu
        String verificationCode = generateVerificationCode();
        
        // Vytvoření uživatele (ale zatím neověřený)
        String hashedPassword = passwordEncoder.encode(password);
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(hashedPassword);
        user.setVerificationCode(verificationCode);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10)); // Platnost 10 minut
        user.setEmailVerified(false);
        
        userRepository.save(user);
        
        // Odeslání emailu s kódem
        try {
            emailService.sendVerificationCode(email, verificationCode);
            return "Na váš email byl odeslán ověřovací kód";
        } catch (Exception e) {
            // Pokud se nepodaří odeslat email, smažeme uživatele
            userRepository.delete(user);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nepodařilo se odeslat ověřovací email");
        }
    }

    public String verifyEmail(String email, String verificationCode) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
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

    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // Generuje číslo mezi 100000-999999
        return String.valueOf(code);
    }

    // Původní metoda pro zpětnou kompatibilitu
    public void register(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Uživatel již existuje");
        }
        String hashedPassword = passwordEncoder.encode(password);
        User user = new User();
        user.setUsername(username);
        user.setPassword(hashedPassword);
        user.setEmailVerified(true); // Pro původní registrace bez emailu
        userRepository.save(user);
    }
}