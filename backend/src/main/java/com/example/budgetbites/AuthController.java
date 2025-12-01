package com.example.budgetbites;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

// přidány importy pro logování
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;


    // Nový endpoint pro registraci s emailem
    @PostMapping("/register")
    public ResponseEntity<String> registerWithEmail(@RequestBody RegisterRequest request) {
        logger.info("[REGISTER] username={}, email={}", request.getUsername(), request.getEmail());
        String message = authService.registerWithEmailVerification(
            request.getUsername(), 
            request.getEmail(), 
            request.getPassword()
        );
        return ResponseEntity.ok(message);
    }

    // Nový endpoint pro verifikaci emailu
    @PostMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestBody VerifyRequest request) {
        logger.info("[VERIFY] email={}, code={}", request.getEmail(), request.getVerificationCode());
        String message = authService.verifyEmail(request.getEmail(), request.getVerificationCode());
        return ResponseEntity.ok(message);
    }

    // Původní endpoint pro zpětnou kompatibilitu
    @PostMapping("/register-simple")
    public ResponseEntity<String> registerSimple(@RequestBody LoginRequest request) {
        logger.info("[REGISTER-SIMPLE] username={}", request.getUsername());
        authService.register(request.getUsername(), request.getPassword());
        return ResponseEntity.ok("Registrace úspěšná");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            boolean success = authService.login(request.getUsername(), request.getPassword());
            if (!success) {
                return ResponseEntity.status(401).body("Špatné údaje");
            }

            String token = jwtService.generateToken(request.getUsername());
            return ResponseEntity.ok(new JwtResponse(token));

        } catch (ResponseStatusException ex) {
            // typicky 403, když není ověřený email
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getReason());
        }
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .filter(User::isEmailVerified) // Zobrazujeme pouze ověřené uživatele
                .map(u -> new UserResponse(u.getId(), u.getUsername()))
                .collect(Collectors.toList());
    }
}