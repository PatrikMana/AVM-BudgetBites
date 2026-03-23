package com.example.budgetbites.controller;

import com.example.budgetbites.dto.response.*;
import com.example.budgetbites.service.CocktailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cocktails")
public class CocktailController {

    private final CocktailService cocktailService;

    public CocktailController(CocktailService cocktailService) {
        this.cocktailService = cocktailService;
    }

    // ==================== COCKTAILS ====================

    /**
     * GET /api/cocktails
     * Vrátí seznam koktejlů s paginací
     */
    @GetMapping
    public ResponseEntity<CocktailListResponse> getAllCocktails(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(cocktailService.getAllCocktails(page, size));
    }

    /**
     * GET /api/cocktails/{id}
     * Vrátí koktejl podle ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CocktailResponse> getCocktailById(@PathVariable Long id) {
        return cocktailService.getCocktailById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/cocktails/external/{externalId}
     * Vrátí koktejl podle externího ID (z TheCocktailDB)
     */
    @GetMapping("/external/{externalId}")
    public ResponseEntity<CocktailResponse> getCocktailByExternalId(@PathVariable String externalId) {
        return cocktailService.getCocktailByExternalId(externalId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/cocktails/search?name=...
     * Vyhledá koktejly podle názvu
     */
    @GetMapping("/search")
    public ResponseEntity<List<CocktailResponse>> searchCocktails(@RequestParam String name) {
        return ResponseEntity.ok(cocktailService.searchCocktailsByName(name));
    }

    /**
     * GET /api/cocktails/random
     * Vrátí náhodný koktejl
     */
    @GetMapping("/random")
    public ResponseEntity<CocktailResponse> getRandomCocktail() {
        CocktailResponse cocktail = cocktailService.getRandomCocktail();
        if (cocktail != null) {
            return ResponseEntity.ok(cocktail);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * GET /api/cocktails/category/{categoryId}
     * Vrátí koktejly podle kategorie
     */
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<CocktailResponse>> getCocktailsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(cocktailService.getCocktailsByCategory(categoryId));
    }

    /**
     * GET /api/cocktails/glass/{glassId}
     * Vrátí koktejly podle typu sklenice
     */
    @GetMapping("/glass/{glassId}")
    public ResponseEntity<List<CocktailResponse>> getCocktailsByGlass(@PathVariable Long glassId) {
        return ResponseEntity.ok(cocktailService.getCocktailsByGlass(glassId));
    }

    /**
     * GET /api/cocktails/alcoholic/{type}
     * Vrátí koktejly podle alkoholického typu (Alcoholic, Non alcoholic, Optional alcohol)
     */
    @GetMapping("/alcoholic/{type}")
    public ResponseEntity<List<CocktailResponse>> getCocktailsByAlcoholicType(@PathVariable String type) {
        return ResponseEntity.ok(cocktailService.getCocktailsByAlcoholicType(type));
    }

    /**
     * GET /api/cocktails/alcoholic-types
     * Vrátí seznam všech alkoholických typů
     */
    @GetMapping("/alcoholic-types")
    public ResponseEntity<List<String>> getAllAlcoholicTypes() {
        return ResponseEntity.ok(cocktailService.getAllAlcoholicTypes());
    }

    /**
     * GET /api/cocktails/ingredient/{ingredientId}
     * Vrátí koktejly obsahující danou ingredienci
     */
    @GetMapping("/ingredient/{ingredientId}")
    public ResponseEntity<List<CocktailResponse>> getCocktailsByIngredient(@PathVariable Long ingredientId) {
        return ResponseEntity.ok(cocktailService.getCocktailsByIngredient(ingredientId));
    }

    /**
     * GET /api/cocktails/ingredient/search?name=...
     * Vrátí koktejly obsahující ingredienci podle názvu
     */
    @GetMapping("/ingredient/search")
    public ResponseEntity<List<CocktailResponse>> getCocktailsByIngredientName(@RequestParam String name) {
        return ResponseEntity.ok(cocktailService.getCocktailsByIngredientName(name));
    }

    /**
     * GET /api/cocktails/ingredients?ids=1,2,3&matchAll=true
     * Vrátí koktejly podle více ingrediencí
     * matchAll=true - koktejl musí obsahovat všechny ingredience
     * matchAll=false - koktejl musí obsahovat alespoň jednu ingredienci
     */
    @GetMapping("/ingredients")
    public ResponseEntity<List<CocktailResponse>> getCocktailsByIngredients(
            @RequestParam List<Long> ids,
            @RequestParam(defaultValue = "false") boolean matchAll) {
        return ResponseEntity.ok(cocktailService.getCocktailsByMultipleIngredients(ids, matchAll));
    }

    // ==================== INGREDIENTS ====================

    /**
     * GET /api/cocktails/all-ingredients
     * Vrátí seznam všech ingrediencí
     */
    @GetMapping("/all-ingredients")
    public ResponseEntity<List<IngredientResponse>> getAllIngredients() {
        return ResponseEntity.ok(cocktailService.getAllIngredients());
    }

    /**
     * GET /api/cocktails/ingredient-detail/{id}
     * Vrátí detail ingredience
     */
    @GetMapping("/ingredient-detail/{id}")
    public ResponseEntity<IngredientResponse> getIngredientById(@PathVariable Long id) {
        return cocktailService.getIngredientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/cocktails/ingredients/search?name=...
     * Vyhledá ingredience podle názvu
     */
    @GetMapping("/ingredients/search")
    public ResponseEntity<List<IngredientResponse>> searchIngredients(@RequestParam String name) {
        return ResponseEntity.ok(cocktailService.searchIngredientsByName(name));
    }

    /**
     * GET /api/cocktails/ingredients/alcoholic
     * Vrátí alkoholické ingredience
     */
    @GetMapping("/ingredients/alcoholic")
    public ResponseEntity<List<IngredientResponse>> getAlcoholicIngredients() {
        return ResponseEntity.ok(cocktailService.getAlcoholicIngredients());
    }

    /**
     * GET /api/cocktails/ingredients/non-alcoholic
     * Vrátí nealkoholické ingredience
     */
    @GetMapping("/ingredients/non-alcoholic")
    public ResponseEntity<List<IngredientResponse>> getNonAlcoholicIngredients() {
        return ResponseEntity.ok(cocktailService.getNonAlcoholicIngredients());
    }

    // ==================== CATEGORIES ====================

    /**
     * GET /api/cocktails/categories
     * Vrátí seznam všech kategorií
     */
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(cocktailService.getAllCategories());
    }

    /**
     * GET /api/cocktails/categories/{id}
     * Vrátí detail kategorie
     */
    @GetMapping("/categories/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable Long id) {
        return cocktailService.getCategoryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== GLASSES ====================

    /**
     * GET /api/cocktails/glasses
     * Vrátí seznam všech typů sklenic
     */
    @GetMapping("/glasses")
    public ResponseEntity<List<GlassResponse>> getAllGlasses() {
        return ResponseEntity.ok(cocktailService.getAllGlasses());
    }

    /**
     * GET /api/cocktails/glasses/{id}
     * Vrátí detail sklenice
     */
    @GetMapping("/glasses/{id}")
    public ResponseEntity<GlassResponse> getGlassById(@PathVariable Long id) {
        return cocktailService.getGlassById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== STATS ====================

    /**
     * GET /api/cocktails/stats
     * Vrátí statistiky
     */
    @GetMapping("/stats")
    public ResponseEntity<CocktailStatsResponse> getStats() {
        return ResponseEntity.ok(cocktailService.getStats());
    }
}
