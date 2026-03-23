package com.example.budgetbites.dto.response;

import java.util.List;
import java.util.stream.Collectors;

import com.example.budgetbites.domain.entity.Cocktail;

public class CocktailResponse {

    private Long id;
    private String externalId;
    private String name;
    private String nameAlternate;
    private String tags;
    private String videoUrl;
    private String category;
    private Long categoryId;
    private String iba;
    private String alcoholicType;
    private String glass;
    private Long glassId;
    private String instructions;
    private String instructionsEs;
    private String instructionsDe;
    private String instructionsFr;
    private String instructionsIt;
    private String imageUrl;
    private String imageSmall;
    private String imageMedium;
    private String imageLarge;
    private String dateModified;
    private List<CocktailIngredientResponse> ingredients;

    public CocktailResponse() {}

    public static CocktailResponse fromEntity(Cocktail cocktail) {
        CocktailResponse response = new CocktailResponse();
        response.setId(cocktail.getId());
        response.setExternalId(cocktail.getExternalId());
        response.setName(cocktail.getName());
        response.setNameAlternate(cocktail.getNameAlternate());
        response.setTags(cocktail.getTags());
        response.setVideoUrl(cocktail.getVideoUrl());

        if (cocktail.getCategory() != null) {
            response.setCategory(cocktail.getCategory().getName());
            response.setCategoryId(cocktail.getCategory().getId());
        }

        response.setIba(cocktail.getIba());
        response.setAlcoholicType(cocktail.getAlcoholicType());

        if (cocktail.getGlass() != null) {
            response.setGlass(cocktail.getGlass().getName());
            response.setGlassId(cocktail.getGlass().getId());
        }

        response.setInstructions(cocktail.getInstructions());
        response.setInstructionsEs(cocktail.getInstructionsEs());
        response.setInstructionsDe(cocktail.getInstructionsDe());
        response.setInstructionsFr(cocktail.getInstructionsFr());
        response.setInstructionsIt(cocktail.getInstructionsIt());
        response.setImageUrl(cocktail.getImageUrl());
        response.setImageSmall(cocktail.getImageSmall());
        response.setImageMedium(cocktail.getImageMedium());
        response.setImageLarge(cocktail.getImageLarge());
        response.setDateModified(cocktail.getDateModified());

        response.setIngredients(cocktail.getCocktailIngredients().stream()
                .map(CocktailIngredientResponse::fromEntity)
                .collect(Collectors.toList()));

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

    public String getNameAlternate() {
        return nameAlternate;
    }

    public void setNameAlternate(String nameAlternate) {
        this.nameAlternate = nameAlternate;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getIba() {
        return iba;
    }

    public void setIba(String iba) {
        this.iba = iba;
    }

    public String getAlcoholicType() {
        return alcoholicType;
    }

    public void setAlcoholicType(String alcoholicType) {
        this.alcoholicType = alcoholicType;
    }

    public String getGlass() {
        return glass;
    }

    public void setGlass(String glass) {
        this.glass = glass;
    }

    public Long getGlassId() {
        return glassId;
    }

    public void setGlassId(Long glassId) {
        this.glassId = glassId;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public String getInstructionsEs() {
        return instructionsEs;
    }

    public void setInstructionsEs(String instructionsEs) {
        this.instructionsEs = instructionsEs;
    }

    public String getInstructionsDe() {
        return instructionsDe;
    }

    public void setInstructionsDe(String instructionsDe) {
        this.instructionsDe = instructionsDe;
    }

    public String getInstructionsFr() {
        return instructionsFr;
    }

    public void setInstructionsFr(String instructionsFr) {
        this.instructionsFr = instructionsFr;
    }

    public String getInstructionsIt() {
        return instructionsIt;
    }

    public void setInstructionsIt(String instructionsIt) {
        this.instructionsIt = instructionsIt;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
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

    public String getDateModified() {
        return dateModified;
    }

    public void setDateModified(String dateModified) {
        this.dateModified = dateModified;
    }

    public List<CocktailIngredientResponse> getIngredients() {
        return ingredients;
    }

    public void setIngredients(List<CocktailIngredientResponse> ingredients) {
        this.ingredients = ingredients;
    }
}
