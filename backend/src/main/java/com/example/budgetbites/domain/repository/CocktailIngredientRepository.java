package com.example.budgetbites.domain.repository;

import com.example.budgetbites.domain.entity.CocktailIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CocktailIngredientRepository extends JpaRepository<CocktailIngredient, Long> {

    List<CocktailIngredient> findByCocktailId(Long cocktailId);

    List<CocktailIngredient> findByIngredientId(Long ingredientId);
}
