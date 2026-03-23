package com.example.budgetbites.service;

import com.example.budgetbites.domain.entity.*;
import com.example.budgetbites.domain.repository.*;
import com.example.budgetbites.dto.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CocktailService {

    private final CocktailRepository cocktailRepository;
    private final IngredientRepository ingredientRepository;
    private final CategoryRepository categoryRepository;
    private final GlassRepository glassRepository;

    public CocktailService(CocktailRepository cocktailRepository,
                           IngredientRepository ingredientRepository,
                           CategoryRepository categoryRepository,
                           GlassRepository glassRepository) {
        this.cocktailRepository = cocktailRepository;
        this.ingredientRepository = ingredientRepository;
        this.categoryRepository = categoryRepository;
        this.glassRepository = glassRepository;
    }

    // ==================== COCKTAILS ====================

    public CocktailListResponse getAllCocktails(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name"));
        Page<Cocktail> cocktailPage = cocktailRepository.findAll(pageable);

        List<CocktailResponse> cocktails = cocktailPage.getContent().stream()
                .map(CocktailResponse::fromEntity)
                .collect(Collectors.toList());

        return new CocktailListResponse(cocktails, (int) cocktailPage.getTotalElements(), page, size);
    }

    public Optional<CocktailResponse> getCocktailById(Long id) {
        return cocktailRepository.findById(id)
                .map(CocktailResponse::fromEntity);
    }

    public Optional<CocktailResponse> getCocktailByExternalId(String externalId) {
        return cocktailRepository.findByExternalId(externalId)
                .map(CocktailResponse::fromEntity);
    }

    public List<CocktailResponse> searchCocktailsByName(String name) {
        return cocktailRepository.findByNameContainingIgnoreCase(name).stream()
                .map(CocktailResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<CocktailResponse> getCocktailsByCategory(Long categoryId) {
        return cocktailRepository.findByCategoryId(categoryId).stream()
                .map(CocktailResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<CocktailResponse> getCocktailsByGlass(Long glassId) {
        return cocktailRepository.findByGlassId(glassId).stream()
                .map(CocktailResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<CocktailResponse> getCocktailsByAlcoholicType(String alcoholicType) {
        return cocktailRepository.findByAlcoholicType(alcoholicType).stream()
                .map(CocktailResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<CocktailResponse> getCocktailsByIngredient(Long ingredientId) {
        return cocktailRepository.findByIngredientId(ingredientId).stream()
                .map(CocktailResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<CocktailResponse> getCocktailsByIngredientName(String ingredientName) {
        return cocktailRepository.findByIngredientNameContaining(ingredientName).stream()
                .map(CocktailResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<CocktailResponse> getCocktailsByMultipleIngredients(List<Long> ingredientIds, boolean matchAll) {
        List<Cocktail> cocktails;
        if (matchAll) {
            cocktails = cocktailRepository.findByAllIngredientIds(ingredientIds, ingredientIds.size());
        } else {
            cocktails = cocktailRepository.findByAnyIngredientIds(ingredientIds);
        }
        return cocktails.stream()
                .map(CocktailResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public CocktailResponse getRandomCocktail() {
        long count = cocktailRepository.count();
        if (count == 0) {
            return null;
        }
        int randomIndex = (int) (Math.random() * count);
        Pageable pageable = PageRequest.of(randomIndex, 1);
        Page<Cocktail> page = cocktailRepository.findAll(pageable);
        if (page.hasContent()) {
            return CocktailResponse.fromEntity(page.getContent().get(0));
        }
        return null;
    }

    public List<String> getAllAlcoholicTypes() {
        return cocktailRepository.findDistinctAlcoholicTypes();
    }

    // ==================== INGREDIENTS ====================

    public List<IngredientResponse> getAllIngredients() {
        return ingredientRepository.findAll().stream()
                .map(IngredientResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Optional<IngredientResponse> getIngredientById(Long id) {
        return ingredientRepository.findById(id)
                .map(IngredientResponse::fromEntity);
    }

    public List<IngredientResponse> searchIngredientsByName(String name) {
        return ingredientRepository.findByNameContainingIgnoreCase(name).stream()
                .map(IngredientResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<IngredientResponse> getAlcoholicIngredients() {
        return ingredientRepository.findByIsAlcoholTrue().stream()
                .map(IngredientResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<IngredientResponse> getNonAlcoholicIngredients() {
        return ingredientRepository.findByIsAlcoholFalse().stream()
                .map(IngredientResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ==================== CATEGORIES ====================

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Optional<CategoryResponse> getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .map(CategoryResponse::fromEntity);
    }

    // ==================== GLASSES ====================

    public List<GlassResponse> getAllGlasses() {
        return glassRepository.findAll().stream()
                .map(GlassResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Optional<GlassResponse> getGlassById(Long id) {
        return glassRepository.findById(id)
                .map(GlassResponse::fromEntity);
    }

    // ==================== STATS ====================

    public CocktailStatsResponse getStats() {
        return new CocktailStatsResponse(
                cocktailRepository.count(),
                ingredientRepository.count(),
                categoryRepository.count(),
                glassRepository.count()
        );
    }
}
