package com.example.budgetbites;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    // Nový endpoint pro registraci s emailem
    @PostMapping("/register")
    public ResponseEntity<String> registerWithEmail(@RequestBody RegisterRequest request) {
        System.out.println("[REGISTER] username=" + request.getUsername() + ", email=" + request.getEmail());
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
        System.out.println("[VERIFY] email=" + request.getEmail() + ", code=" + request.getVerificationCode());
        String message = authService.verifyEmail(request.getEmail(), request.getVerificationCode());
        return ResponseEntity.ok(message);
    }

    // Původní endpoint pro zpětnou kompatibilitu
    @PostMapping("/register-simple")
    public ResponseEntity<String> registerSimple(@RequestBody LoginRequest request) {
        System.out.println("[REGISTER-SIMPLE] username=" + request.getUsername());
        authService.register(request.getUsername(), request.getPassword());
        return ResponseEntity.ok("Registrace úspěšná");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        boolean success = authService.login(request.getUsername(), request.getPassword());
        return success ? ResponseEntity.ok("Přihlášení úspěšné") :
                ResponseEntity.status(401).body("Špatné údaje");
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .filter(User::isEmailVerified) // Zobrazujeme pouze ověřené uživatele
                .map(u -> new UserResponse(u.getId(), u.getUsername()))
                .collect(Collectors.toList());
    }
}