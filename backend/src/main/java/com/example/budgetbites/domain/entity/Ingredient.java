package com.example.budgetbites.domain.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "ingredients")
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", unique = true)
    private String externalId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String type;

    private Boolean isAlcohol;

    private String abv;

    @Column(name = "image_small")
    private String imageSmall;

    @Column(name = "image_medium")
    private String imageMedium;

    @Column(name = "image_large")
    private String imageLarge;

    @OneToMany(mappedBy = "ingredient", cascade = CascadeType.ALL)
    private List<CocktailIngredient> cocktailIngredients = new ArrayList<>();

    public Ingredient() {}

    public Ingredient(String name) {
        this.name = name;
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

    public List<CocktailIngredient> getCocktailIngredients() {
        return cocktailIngredients;
    }

    public void setCocktailIngredients(List<CocktailIngredient> cocktailIngredients) {
        this.cocktailIngredients = cocktailIngredients;
    }
}
