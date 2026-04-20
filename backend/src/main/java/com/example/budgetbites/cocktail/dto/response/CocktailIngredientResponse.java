package com.example.budgetbites.cocktail.dto.response;

import com.example.budgetbites.cocktail.entity.CocktailIngredient;

public class CocktailIngredientResponse {

    private Long ingredientId;
    private String ingredientName;
    private String measure;
    private Integer position;
    private String imageSmall;

    public CocktailIngredientResponse() {}

    public static CocktailIngredientResponse fromEntity(CocktailIngredient ci) {
        CocktailIngredientResponse response = new CocktailIngredientResponse();
        response.setIngredientId(ci.getIngredient().getId());
        response.setIngredientName(ci.getIngredient().getName());
        response.setMeasure(ci.getMeasure());
        response.setPosition(ci.getPosition());
        response.setImageSmall(ci.getIngredient().getImageSmall());
        return response;
    }

    public Long getIngredientId() {
        return ingredientId;
    }

    public void setIngredientId(Long ingredientId) {
        this.ingredientId = ingredientId;
    }

    public String getIngredientName() {
        return ingredientName;
    }

    public void setIngredientName(String ingredientName) {
        this.ingredientName = ingredientName;
    }

    public String getMeasure() {
        return measure;
    }

    public void setMeasure(String measure) {
        this.measure = measure;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    public String getImageSmall() {
        return imageSmall;
    }

    public void setImageSmall(String imageSmall) {
        this.imageSmall = imageSmall;
    }
}
