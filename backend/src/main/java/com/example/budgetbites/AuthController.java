package com.example.budgetbites;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

// Import LoginRequest
import com.example.budgetbites.LoginRequest;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody LoginRequest request) {
        System.out.println("[REGISTER] username=" + request.getUsername());
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
                .map(u -> new UserResponse(u.getId(), u.getUsername()))
                .collect(Collectors.toList());
    }
}
