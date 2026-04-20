package com.example.budgetbites.cocktail.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.budgetbites.cocktail.entity.Glass;

@Repository
public interface GlassRepository extends JpaRepository<Glass, Long> {

    Optional<Glass> findByName(String name);

    boolean existsByName(String name);
}
