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
    public ResponseEntity<ApiMessageResponse> registerWithEmail(@RequestBody RegisterRequest request) {
        logger.info("[REGISTER] username={}, email={}", request.getUsername(), request.getEmail());
        String message = authService.registerWithEmailVerification(
                request.getUsername(),
                request.getEmail(),
                request.getPassword()
        );
        return ResponseEntity.ok(new ApiMessageResponse(message));
    }

    // Nový endpoint pro verifikaci emailu
    @PostMapping("/verify-email")
    public ResponseEntity<ApiMessageResponse> verifyEmail(@RequestBody VerifyRequest request) {
        logger.info("[VERIFY] email={}", request.getEmail()); // ne logovat code
        String message = authService.verifyEmail(request.getEmail(), request.getVerificationCode());
        return ResponseEntity.ok(new ApiMessageResponse(message));
    }

    // Původní endpoint pro zpětnou kompatibilitu
    @PostMapping("/register-simple")
    public ResponseEntity<String> registerSimple(@RequestBody LoginRequest request) {
        logger.info("[REGISTER-SIMPLE] username={}", request.getUsername());
        authService.register(request.getUsername(), request.getPassword());
        return ResponseEntity.ok("Registrace úspěšná");
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@RequestBody LoginRequest request) {
        boolean success = authService.login(request.getUsername(), request.getPassword());
        if (!success) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "Špatné údaje"
            );
        }

        String token = jwtService.generateToken(request.getUsername());
        return ResponseEntity.ok(new JwtResponse(token));
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .filter(User::isEmailVerified) // Zobrazujeme pouze ověřené uživatele
                .map(u -> new UserResponse(u.getId(), u.getUsername()))
                .collect(Collectors.toList());
    }

    @GetMapping("/verification-status")
    public ResponseEntity<VerificationStatusResponse> verificationStatus(@RequestParam String email) {
        return ResponseEntity.ok(authService.getVerificationStatus(email));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiMessageResponse> resendVerification(@RequestBody ResendVerificationRequest request) {
        logger.info("[RESEND] email={}", request.getEmail());
        String msg = authService.resendVerificationCode(request.getEmail());
        return ResponseEntity.ok(new ApiMessageResponse(msg));
    }
}