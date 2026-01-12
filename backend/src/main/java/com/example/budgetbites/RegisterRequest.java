package com.example.budgetbites;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "username je povinný")
    @Size(min = 3, max = 32, message = "username musí mít 3–32 znaků")
    private String username;

    @NotBlank(message = "email je povinný")
    @Email(message = "email nemá správný formát")
    private String email;

    @NotBlank(message = "password je povinné")
    @Size(min = 8, max = 128, message = "password musí mít aspoň 8 znaků")
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}