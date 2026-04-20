package com.example.budgetbites.cocktail.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "cocktails")
public class Cocktail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", unique = true, nullable = false)
    private String externalId;

    @Column(nullable = false)
    private String name;

    @Column(name = "name_alternate")
    private String nameAlternate;

    private String tags;

    @Column(name = "video_url")
    private String videoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    private String iba;

    @Column(name = "alcoholic_type")
    private String alcoholicType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "glass_id")
    private Glass glass;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "instructions_es", columnDefinition = "TEXT")
    private String instructionsEs;

    @Column(name = "instructions_de", columnDefinition = "TEXT")
    private String instructionsDe;

    @Column(name = "instructions_fr", columnDefinition = "TEXT")
    private String instructionsFr;

    @Column(name = "instructions_it", columnDefinition = "TEXT")
    private String instructionsIt;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "image_small")
    private String imageSmall;

    @Column(name = "image_medium")
    private String imageMedium;

    @Column(name = "image_large")
    private String imageLarge;

    @Column(name = "date_modified")
    private String dateModified;

    @OneToMany(mappedBy = "cocktail", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<CocktailIngredient> cocktailIngredients = new ArrayList<>();

    public Cocktail() {}

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

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
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

    public Glass getGlass() {
        return glass;
    }

    public void setGlass(Glass glass) {
        this.glass = glass;
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

    public List<CocktailIngredient> getCocktailIngredients() {
        return cocktailIngredients;
    }

    public void setCocktailIngredients(List<CocktailIngredient> cocktailIngredients) {
        this.cocktailIngredients = cocktailIngredients;
    }

    public void addIngredient(Ingredient ingredient, String measure, Integer position) {
        CocktailIngredient ci = new CocktailIngredient(this, ingredient, measure, position);
        cocktailIngredients.add(ci);
    }
}
