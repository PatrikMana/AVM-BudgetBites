package com.example.budgetbites.cocktail.dto.response;

import com.example.budgetbites.cocktail.entity.Ingredient;

public class IngredientResponse {

    private Long id;
    private String externalId;
    private String name;
    private String description;
    private String type;
    private Boolean isAlcohol;
    private String abv;
    private String imageSmall;
    private String imageMedium;
    private String imageLarge;

    public IngredientResponse() {}

    public static IngredientResponse fromEntity(Ingredient ingredient) {
        IngredientResponse response = new IngredientResponse();
        response.setId(ingredient.getId());
        response.setExternalId(ingredient.getExternalId());
        response.setName(ingredient.getName());
        response.setDescription(ingredient.getDescription());
        response.setType(ingredient.getType());
        response.setIsAlcohol(ingredient.getIsAlcohol());
        response.setAbv(ingredient.getAbv());
        response.setImageSmall(ingredient.getImageSmall());
        response.setImageMedium(ingredient.getImageMedium());
        response.setImageLarge(ingredient.getImageLarge());
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getExternalId() {
        return externalId;
    }

    public void setExternalId(String externalId) {
        this.externalId = externalId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Boolean getIsAlcohol() {
        return isAlcohol;
    }

    public void setIsAlcohol(Boolean isAlcohol) {
        this.isAlcohol = isAlcohol;
    }

    public String getAbv() {
        return abv;
    }

    public void setAbv(String abv) {
        this.abv = abv;
    }

    public String getImageSmall() {
        return imageSmall;
    }

    public void setImageSmall(String imageSmall) {
        this.imageSmall = imageSmall;
    }

    public String getImageMedium() {
        return imageMedium;
    }

    public void setImageMedium(String imageMedium) {
        this.imageMedium = imageMedium;
    }

    public String getImageLarge() {
        return imageLarge;
    }

    public void setImageLarge(String imageLarge) {
        this.imageLarge = imageLarge;
    }
}
