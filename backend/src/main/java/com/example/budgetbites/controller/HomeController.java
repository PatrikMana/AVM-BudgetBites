package com.example.budgetbites.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller pro základní API endpointy.
 * Slouží pro testování a základní funkcionalitu.
 */
@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class HomeController {

    /**
     * Testovací endpoint.
     * GET /api/hello
     */
    @GetMapping("/api/hello")
    public String hello() {
        return "Hello World";
    }

    /**
     * Testovací endpoint pro POST.
     * POST /clicked
     */
    @PostMapping("/clicked")
    @ResponseBody
    public String handleClick() {
        return "You clicked the button!";
    }
}
