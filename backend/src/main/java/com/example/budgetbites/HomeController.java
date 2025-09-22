package com.example.budgetbites;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class HomeController {

    @GetMapping("/api/hello")
    public String hello() {
        return "Hello World";
    }

    @PostMapping("/clicked")
    @ResponseBody
    public String handleClick() {
        return "You clicked the button!";
    }
}
