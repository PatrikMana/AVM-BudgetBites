package com.example.budgetbites.cocktail.dto.response;

import com.example.budgetbites.cocktail.entity.Category;

public class CategoryResponse {

    private Long id;
    private String name;
    private int cocktailCount;

    public CategoryResponse() {}

    public static CategoryResponse fromEntity(Category category) {
        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setCocktailCount(category.getCocktails() != null ? category.getCocktails().size() : 0);
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getCocktailCount() {
        return cocktailCount;
    }

    public void setCocktailCount(int cocktailCount) {
        this.cocktailCount = cocktailCount;
    }
}
