package com.example.budgetbites.cocktail.dto.response;

public class CocktailStatsResponse {

    private long totalCocktails;
    private long totalIngredients;
    private long totalCategories;
    private long totalGlasses;

    public CocktailStatsResponse() {}

    public CocktailStatsResponse(long totalCocktails, long totalIngredients,
                                  long totalCategories, long totalGlasses) {
        this.totalCocktails = totalCocktails;
        this.totalIngredients = totalIngredients;
        this.totalCategories = totalCategories;
        this.totalGlasses = totalGlasses;
    }

    public long getTotalCocktails() {
        return totalCocktails;
    }

    public void setTotalCocktails(long totalCocktails) {
        this.totalCocktails = totalCocktails;
    }

    public long getTotalIngredients() {
        return totalIngredients;
    }

    public void setTotalIngredients(long totalIngredients) {
        this.totalIngredients = totalIngredients;
    }

    public long getTotalCategories() {
        return totalCategories;
    }

    public void setTotalCategories(long totalCategories) {
        this.totalCategories = totalCategories;
    }

    public long getTotalGlasses() {
        return totalGlasses;
    }

    public void setTotalGlasses(long totalGlasses) {
        this.totalGlasses = totalGlasses;
    }
}
