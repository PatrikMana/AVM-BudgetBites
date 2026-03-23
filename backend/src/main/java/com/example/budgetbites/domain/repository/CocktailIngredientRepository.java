package com.example.budgetbites.domain.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.budgetbites.domain.entity.CocktailIngredient;

@Repository
public interface CocktailIngredientRepository extends JpaRepository<CocktailIngredient, Long> {

    List<CocktailIngredient> findByCocktailId(Long cocktailId);

    List<CocktailIngredient> findByIngredientId(Long ingredientId);
}
