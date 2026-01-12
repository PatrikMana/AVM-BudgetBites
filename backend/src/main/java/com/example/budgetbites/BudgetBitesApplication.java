package com.example.budgetbites;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class BudgetBitesApplication {

    public static void main(String[] args) {
        SpringApplication.run(BudgetBitesApplication.class, args);
    }

}
