package com.example.budgetbites.dto.response;

import com.example.budgetbites.domain.entity.Glass;

public class GlassResponse {

    private Long id;
    private String name;
    private int cocktailCount;

    public GlassResponse() {}

    public static GlassResponse fromEntity(Glass glass) {
        GlassResponse response = new GlassResponse();
        response.setId(glass.getId());
        response.setName(glass.getName());
        response.setCocktailCount(glass.getCocktails() != null ? glass.getCocktails().size() : 0);
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
