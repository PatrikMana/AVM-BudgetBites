package com.example.budgetbites;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Hlavní třída aplikace BudgetBites.
 * 
 * BudgetBites je aplikace pro plánování jídel na základě aktuálních slev
 * v českých supermarketech (Albert, Lidl, Kaufland, Billa, Penny, Globus).
 * 
 * @see <a href="README.md">README.md</a> pro více informací o architektuře
 */
@EnableScheduling
@SpringBootApplication
public class BudgetBitesApplication {

    public static void main(String[] args) {
        SpringApplication.run(BudgetBitesApplication.class, args);
    }
}

