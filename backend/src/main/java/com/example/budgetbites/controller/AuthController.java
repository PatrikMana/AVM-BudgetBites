package com.example.budgetbites.controller;

import com.example.budgetbites.domain.entity.User;
import com.example.budgetbites.domain.repository.UserRepository;
import com.example.budgetbites.dto.request.LoginRequest;
import com.example.budgetbites.dto.request.RegisterRequest;
import com.example.budgetbites.dto.request.ResendVerificationRequest;
import com.example.budgetbites.dto.request.VerifyRequest;
import com.example.budgetbites.dto.response.ApiMessageResponse;
import com.example.budgetbites.dto.response.JwtResponse;
import com.example.budgetbites.dto.response.UserResponse;
import com.example.budgetbites.dto.response.VerificationStatusResponse;
import com.example.budgetbites.security.JwtService;
import com.example.budgetbites.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.example.budgetbites.dto.request.ForgotPasswordRequest;
import com.example.budgetbites.dto.request.ResetPasswordRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller pro autentizaci a správu uživatelů.
 * Poskytuje endpointy pro registraci, přihlášení a verifikaci emailu.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Value("${app.frontend.reset-password-url:http://localhost:5173/reset-password}")
    private String resetPasswordUrl;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Registrace nového uživatele s emailovou verifikací.
     * POST /auth/register
     */
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

    /**
     * Verifikace emailu pomocí kódu.
     * POST /auth/verify-email
     */
    @PostMapping("/verify-email")
    public ResponseEntity<ApiMessageResponse> verifyEmail(@RequestBody VerifyRequest request) {
        logger.info("[VERIFY] email={}", request.getEmail());
        String message = authService.verifyEmail(request.getEmail(), request.getVerificationCode());
        return ResponseEntity.ok(new ApiMessageResponse(message));
    }

    /**
     * Jednoduchá registrace bez emailové verifikace (pro zpětnou kompatibilitu).
     * POST /auth/register-simple
     */
    @PostMapping("/register-simple")
    public ResponseEntity<String> registerSimple(@RequestBody LoginRequest request) {
        logger.info("[REGISTER-SIMPLE] username={}", request.getUsername());
        authService.register(request.getUsername(), request.getPassword());
        return ResponseEntity.ok("Registrace úspěšná");
    }

    /**
     * Přihlášení uživatele a získání JWT tokenu.
     * POST /auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@RequestBody LoginRequest request) {
        boolean success = authService.login(request.getUsername(), request.getPassword());
        if (!success) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Špatné údaje");
        }

        String token = jwtService.generateToken(request.getUsername());
        return ResponseEntity.ok(new JwtResponse(token));
    }

    /**
     * Seznam ověřených uživatelů.
     * GET /auth/users
     */
    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .filter(User::isEmailVerified)
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getEmail()))
                .collect(Collectors.toList());
    }

    /**
     * Vrátí údaje aktuálně přihlášeného uživatele.
     * GET /auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Uživatel nenalezen"));

        return ResponseEntity.ok(new UserResponse(user.getId(), user.getUsername(), user.getEmail()));
    }

    /**
     * Stav verifikace emailu.
     * GET /auth/verification-status?email=...
     */
    @GetMapping("/verification-status")
    public ResponseEntity<VerificationStatusResponse> verificationStatus(@RequestParam String email) {
        return ResponseEntity.ok(authService.getVerificationStatus(email));
    }

    /**
     * Opětovné zaslání verifikačního kódu.
     * POST /auth/resend-verification
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiMessageResponse> resendVerification(@RequestBody ResendVerificationRequest request) {
        logger.info("[RESEND] email={}", request.getEmail());
        String msg = authService.resendVerificationCode(request.getEmail());
        return ResponseEntity.ok(new ApiMessageResponse(msg));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiMessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String msg = authService.forgotPassword(request.getEmail(), resetPasswordUrl);
        return ResponseEntity.ok(new ApiMessageResponse(msg));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiMessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String msg = authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(new ApiMessageResponse(msg));
    }
}
