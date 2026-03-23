package com.example.budgetbites.domain.repository;

import com.example.budgetbites.domain.entity.Cocktail;
import com.example.budgetbites.domain.entity.Category;
import com.example.budgetbites.domain.entity.Glass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CocktailRepository extends JpaRepository<Cocktail, Long> {

    Optional<Cocktail> findByExternalId(String externalId);

    boolean existsByExternalId(String externalId);

    List<Cocktail> findByNameContainingIgnoreCase(String name);

    List<Cocktail> findByCategory(Category category);

    List<Cocktail> findByCategoryId(Long categoryId);

    List<Cocktail> findByGlass(Glass glass);

    List<Cocktail> findByGlassId(Long glassId);

    List<Cocktail> findByAlcoholicType(String alcoholicType);

    @Query("SELECT DISTINCT c FROM Cocktail c " +
            "JOIN c.cocktailIngredients ci " +
            "WHERE ci.ingredient.id = :ingredientId")
    List<Cocktail> findByIngredientId(@Param("ingredientId") Long ingredientId);

    @Query("SELECT DISTINCT c FROM Cocktail c " +
            "JOIN c.cocktailIngredients ci " +
            "WHERE LOWER(ci.ingredient.name) LIKE LOWER(CONCAT('%', :ingredientName, '%'))")
    List<Cocktail> findByIngredientNameContaining(@Param("ingredientName") String ingredientName);

    @Query("SELECT DISTINCT c FROM Cocktail c " +
            "JOIN c.cocktailIngredients ci " +
            "WHERE ci.ingredient.id IN :ingredientIds " +
            "GROUP BY c.id " +
            "HAVING COUNT(DISTINCT ci.ingredient.id) = :ingredientCount")
    List<Cocktail> findByAllIngredientIds(@Param("ingredientIds") List<Long> ingredientIds,
                                           @Param("ingredientCount") long ingredientCount);

    @Query("SELECT DISTINCT c FROM Cocktail c " +
            "JOIN c.cocktailIngredients ci " +
            "WHERE ci.ingredient.id IN :ingredientIds")
    List<Cocktail> findByAnyIngredientIds(@Param("ingredientIds") List<Long> ingredientIds);

    Page<Cocktail> findAll(Pageable pageable);

    @Query("SELECT DISTINCT c.alcoholicType FROM Cocktail c WHERE c.alcoholicType IS NOT NULL")
    List<String> findDistinctAlcoholicTypes();

    long count();
}
