package com.example.budgetbites.cocktail.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.budgetbites.cocktail.entity.Ingredient;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    Optional<Ingredient> findByExternalId(String externalId);

    Optional<Ingredient> findByNameIgnoreCase(String name);

    List<Ingredient> findByNameContainingIgnoreCase(String name);

    List<Ingredient> findByIsAlcoholTrue();

    List<Ingredient> findByIsAlcoholFalse();

    @Query("SELECT i FROM Ingredient i WHERE LOWER(i.name) = LOWER(:name)")
    Optional<Ingredient> findByNameExact(@Param("name") String name);

    boolean existsByExternalId(String externalId);
}
