package com.example.budgetbites.service;

import com.example.budgetbites.domain.entity.*;
import com.example.budgetbites.domain.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service
public class CocktailDataLoaderService {

    private static final Logger logger = LoggerFactory.getLogger(CocktailDataLoaderService.class);

    private final CocktailRepository cocktailRepository;
    private final IngredientRepository ingredientRepository;
    private final CategoryRepository categoryRepository;
    private final GlassRepository glassRepository;
    private final ObjectMapper objectMapper;

    private Map<String, Ingredient> ingredientCache = new HashMap<>();
    private Map<String, Category> categoryCache = new HashMap<>();
    private Map<String, Glass> glassCache = new HashMap<>();

    public CocktailDataLoaderService(CocktailRepository cocktailRepository,
                                      IngredientRepository ingredientRepository,
                                      CategoryRepository categoryRepository,
                                      GlassRepository glassRepository) {
        this.cocktailRepository = cocktailRepository;
        this.ingredientRepository = ingredientRepository;
        this.categoryRepository = categoryRepository;
        this.glassRepository = glassRepository;
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void init() {
        loadDataIfEmpty();
    }

    @Transactional
    public void loadDataIfEmpty() {
        long cocktailCount = cocktailRepository.count();
        if (cocktailCount > 0) {
            logger.info("Database already contains {} cocktails, skipping data load", cocktailCount);
            return;
        }

        logger.info("Database is empty, loading cocktail data from JSON files...");

        try {
            loadIngredients();
            loadCocktails();
            logger.info("Data load completed successfully!");
        } catch (Exception e) {
            logger.error("Failed to load cocktail data: {}", e.getMessage(), e);
        }
    }

    private void loadIngredients() throws IOException {
        logger.info("Loading ingredients...");

        ClassPathResource resource = new ClassPathResource("cocktails/ingredients.json");
        if (!resource.exists()) {
            logger.warn("ingredients.json not found in resources/cocktails/");
            return;
        }

        try (InputStream is = resource.getInputStream()) {
            List<JsonNode> ingredientsJson = objectMapper.readValue(is, new TypeReference<List<JsonNode>>() {});

            for (JsonNode json : ingredientsJson) {
                Ingredient ingredient = new Ingredient();
                ingredient.setExternalId(getTextOrNull(json, "idIngredient"));
                ingredient.setName(getTextOrNull(json, "strIngredient"));
                ingredient.setDescription(getTextOrNull(json, "strDescription"));
                ingredient.setType(getTextOrNull(json, "strType"));

                String alcoholStr = getTextOrNull(json, "strAlcohol");
                ingredient.setIsAlcohol("Yes".equalsIgnoreCase(alcoholStr));

                ingredient.setAbv(getTextOrNull(json, "strABV"));

                // Obrázky
                JsonNode images = json.get("images");
                if (images != null) {
                    ingredient.setImageSmall(getTextOrNull(images, "small"));
                    ingredient.setImageMedium(getTextOrNull(images, "medium"));
                    ingredient.setImageLarge(getTextOrNull(images, "large"));
                }

                Ingredient saved = ingredientRepository.save(ingredient);
                ingredientCache.put(ingredient.getName().toLowerCase(), saved);
            }

            logger.info("Loaded {} ingredients", ingredientCache.size());
        }
    }

    private void loadCocktails() throws IOException {
        logger.info("Loading cocktails...");

        ClassPathResource resource = new ClassPathResource("cocktails/cocktails.json");
        if (!resource.exists()) {
            logger.warn("cocktails.json not found in resources/cocktails/");
            return;
        }

        try (InputStream is = resource.getInputStream()) {
            List<JsonNode> cocktailsJson = objectMapper.readValue(is, new TypeReference<List<JsonNode>>() {});

            int loaded = 0;
            for (JsonNode json : cocktailsJson) {
                try {
                    Cocktail cocktail = createCocktailFromJson(json);
                    cocktailRepository.save(cocktail);
                    loaded++;

                    if (loaded % 100 == 0) {
                        logger.info("Loaded {} cocktails...", loaded);
                    }
                } catch (Exception e) {
                    logger.warn("Failed to load cocktail: {}", e.getMessage());
                }
            }

            logger.info("Loaded {} cocktails total", loaded);
        }
    }

    private Cocktail createCocktailFromJson(JsonNode json) {
        Cocktail cocktail = new Cocktail();

        cocktail.setExternalId(getTextOrNull(json, "idDrink"));
        cocktail.setName(getTextOrNull(json, "strDrink"));
        cocktail.setNameAlternate(getTextOrNull(json, "strDrinkAlternate"));
        cocktail.setTags(getTextOrNull(json, "strTags"));
        cocktail.setVideoUrl(getTextOrNull(json, "strVideo"));
        cocktail.setIba(getTextOrNull(json, "strIBA"));
        cocktail.setAlcoholicType(getTextOrNull(json, "strAlcoholic"));
        cocktail.setInstructions(getTextOrNull(json, "strInstructions"));
        cocktail.setInstructionsEs(getTextOrNull(json, "strInstructionsES"));
        cocktail.setInstructionsDe(getTextOrNull(json, "strInstructionsDE"));
        cocktail.setInstructionsFr(getTextOrNull(json, "strInstructionsFR"));
        cocktail.setInstructionsIt(getTextOrNull(json, "strInstructionsIT"));
        cocktail.setImageUrl(getTextOrNull(json, "strDrinkThumb"));
        cocktail.setDateModified(getTextOrNull(json, "dateModified"));

        // Obrázky
        JsonNode images = json.get("images");
        if (images != null) {
            cocktail.setImageSmall(getTextOrNull(images, "small"));
            cocktail.setImageMedium(getTextOrNull(images, "medium"));
            cocktail.setImageLarge(getTextOrNull(images, "large"));
        }

        // Kategorie
        String categoryName = getTextOrNull(json, "strCategory");
        if (categoryName != null) {
            cocktail.setCategory(getOrCreateCategory(categoryName));
        }

        // Sklenice
        String glassName = getTextOrNull(json, "strGlass");
        if (glassName != null) {
            cocktail.setGlass(getOrCreateGlass(glassName));
        }

        // Ingredience (strIngredient1-15, strMeasure1-15)
        for (int i = 1; i <= 15; i++) {
            String ingredientName = getTextOrNull(json, "strIngredient" + i);
            String measure = getTextOrNull(json, "strMeasure" + i);

            if (ingredientName != null && !ingredientName.trim().isEmpty()) {
                Ingredient ingredient = getOrCreateIngredient(ingredientName.trim());
                cocktail.addIngredient(ingredient, measure != null ? measure.trim() : null, i);
            }
        }

        return cocktail;
    }

    private Category getOrCreateCategory(String name) {
        String key = name.toLowerCase();
        if (categoryCache.containsKey(key)) {
            return categoryCache.get(key);
        }

        Category category = categoryRepository.findByName(name)
                .orElseGet(() -> categoryRepository.save(new Category(name)));
        categoryCache.put(key, category);
        return category;
    }

    private Glass getOrCreateGlass(String name) {
        String key = name.toLowerCase();
        if (glassCache.containsKey(key)) {
            return glassCache.get(key);
        }

        Glass glass = glassRepository.findByName(name)
                .orElseGet(() -> glassRepository.save(new Glass(name)));
        glassCache.put(key, glass);
        return glass;
    }

    private Ingredient getOrCreateIngredient(String name) {
        String key = name.toLowerCase();
        if (ingredientCache.containsKey(key)) {
            return ingredientCache.get(key);
        }

        Ingredient ingredient = ingredientRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> {
                    Ingredient newIngredient = new Ingredient(name);
                    // Generuj URL obrázků pro ingredience, které nebyly v JSON
                    String encodedName = name.replace(" ", "%20");
                    newIngredient.setImageSmall("https://www.thecocktaildb.com/images/ingredients/" + encodedName + "-Small.png");
                    newIngredient.setImageMedium("https://www.thecocktaildb.com/images/ingredients/" + encodedName + "-Medium.png");
                    newIngredient.setImageLarge("https://www.thecocktaildb.com/images/ingredients/" + encodedName + ".png");
                    return ingredientRepository.save(newIngredient);
                });

        ingredientCache.put(key, ingredient);
        return ingredient;
    }

    private String getTextOrNull(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text.isEmpty() ? null : text;
    }
}
