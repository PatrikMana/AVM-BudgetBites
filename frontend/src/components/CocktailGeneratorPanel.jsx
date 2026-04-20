import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import {
  Sparkles,
  Wine,
  X,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Star,
  Clock,
  Shuffle,
} from "lucide-react";
import { cn } from "../lib/utils";

// ── Glass types ─────────────────────────────────────────────────────────────
const GLASS_TYPES = [
  "Balloon Glass", "Beer Glass", "Beer mug", "Beer pilsner",
  "Brandy snifter", "Champagne flute", "Cocktail glass", "Coffee mug",
  "Collins glass", "Copper Mug", "Cordial glass", "Coupe Glass",
  "Highball glass", "Hurricane glass", "Irish coffee cup", "Jar",
  "Margarita glass", "Margarita/Coupette glass", "Martini Glass",
  "Mason jar", "Nick and Nora Glass", "Old-fashioned glass",
  "Parfait glass", "Pint glass", "Pitcher", "Pousse cafe glass",
  "Punch bowl", "Shot glass", "Whiskey Glass", "Whiskey sour glass",
  "White wine glass", "Wine Glass",
];

// ── Categories ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Ordinary Drink", "Cocktail", "Shake", "Other / Unknown", "Cocoa",
  "Shot", "Coffee / Tea", "Homemade Liqueur", "Punch / Party Drink",
  "Beer", "Soft Drink",
];

// ── Ingredient image helper ─────────────────────────────────────────────────
function ingredientImgUrl(name, size = "small") {
  const slug = name.trim().replace(/\s+/g, "%20");
  const suffix = size === "small" ? "-Small" : size === "medium" ? "-Medium" : "";
  return `https://www.thecocktaildb.com/images/ingredients/${slug}${suffix}.png`;
}

// ── Example cocktail for testing ────────────────────────────────────────────
export const EXAMPLE_COCKTAIL = {
  drinks: [{
    idDrink: "11007", strDrink: "Margarita", strCategory: "Ordinary Drink",
    strAlcoholic: "Alcoholic", strGlass: "Cocktail glass",
    strInstructions: "Rub the rim of the glass with the lime slice to make the salt stick to it. Take care to moisten only the outer rim and sprinkle the salt on it. The salt should present to the lips of the imbiber and never mix into the cocktail. Shake the other ingredients with ice, then carefully pour into the glass.",
    strDrinkThumb: "https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg",
    strIngredient1: "Tequila", strIngredient2: "Triple sec",
    strIngredient3: "Lime juice", strIngredient4: "Salt",
    strMeasure1: "1 1/2 oz", strMeasure2: "1/2 oz", strMeasure3: "1 oz",
  }],
};

// ── Simple dropdown component ───────────────────────────────────────────────
function Dropdown({ label, value, options, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all",
          value
            ? "bg-green-500/15 text-green-300 hover:bg-green-500/25"
            : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700"
        )}
      >
        <span className="text-zinc-500 text-xs">{label}:</span>
        <span>{value || placeholder}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 shadow-xl min-w-[180px]">
          {value && (
            <button
              onMouseDown={() => { onChange(null); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-700 border-b border-white/5"
            >
              Clear
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt}
              onMouseDown={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 transition-colors",
                value === opt ? "text-green-400 bg-green-500/10" : "text-zinc-300"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Search modes ────────────────────────────────────────────────────────────
// "search" = name / ingredients / filters (the main chat input)
// "popular" | "latest" | "random" = standalone API calls, no filters apply

// ── Main component ──────────────────────────────────────────────────────────
export default function CocktailGeneratorPanel({ onGenerate }) {
  const [mode, setMode] = useState("search");
  const [name, setName] = useState("");
  const [alcoholic, setAlcoholic] = useState(null);
  const [selectedGlass, setSelectedGlass] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [budget, setBudget] = useState([500]);
  const [randomCount, setRandomCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const isSearch = mode === "search"; // eslint-disable-line

  const addIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients((prev) => [...prev, trimmed]);
    }
    setIngredientInput("");
  };

  const removeIngredient = (ing) =>
    setIngredients((prev) => prev.filter((i) => i !== ing));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && ingredientInput.trim()) {
      e.preventDefault();
      addIngredient();
    } else if (e.key === "Enter" && !ingredientInput.trim()) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    setSubmitting(true);
    const payload =
      mode === "search"
        ? {
            mode: "search",
            name: name.trim() || undefined,
            glass: selectedGlass || undefined,
            alcoholic: alcoholic || undefined,
            ingredients: ingredients.length ? ingredients : undefined,
            category: selectedCategory || undefined,
            budget: budget[0],
          }
        : mode === "random"
          ? { mode: "random", count: randomCount, budget: budget[0] }
          : { mode, budget: budget[0] }; // popular / latest

    try {
      if (typeof onGenerate === "function") {
        await onGenerate(payload);
      } else {
        console.log("Generate cocktail with:", payload);
        console.log("Example result:", EXAMPLE_COCKTAIL);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col">
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <Wine className="h-10 w-10 text-purple-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">
            What cocktail are you looking for?
          </h1>
        </div>

        {/* ── Mode tabs ────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 mb-3 self-center">
          {[
            { key: "search", label: "Search", icon: Wine, activeClass: "bg-green-500/15 text-green-400 hover:bg-green-500/25" },
            { key: "popular", label: "Popular", icon: Star, activeClass: "bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25" },
            { key: "latest", label: "Latest", icon: Clock, activeClass: "bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25" },
            { key: "random", label: "Random", icon: Shuffle, activeClass: "bg-purple-500/15 text-purple-400 hover:bg-purple-500/25" },
          ].map(({ key, label, icon: Icon, activeClass }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                mode === key
                  ? activeClass
                  : "bg-zinc-800/40 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Chat-style container ─────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur shadow-2xl">

          {isSearch ? (
            <>
              {/* ── Ingredients (if any) ──────────────────────────────── */}
              {ingredients.length > 0 && (
                <div className="px-4 pt-4 flex flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <Badge
                      key={ing}
                      className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 pl-1.5 pr-1.5 py-1 flex items-center gap-2"
                    >
                      <img
                        src={ingredientImgUrl(ing, "small")}
                        alt={ing}
                        className="h-5 w-5 rounded object-contain"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                      {ing}
                      <button
                        onClick={() => removeIngredient(ing)}
                        className="rounded-full hover:bg-emerald-500/30 p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* ── Main input row ──────────────────────────────────────── */}
              <div className="flex items-center gap-2 p-4">
                <input
                  type="text"
                  placeholder="Search cocktail name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  className="flex-1 bg-transparent text-white text-lg placeholder:text-zinc-600 outline-none"
                />
                <Button
                  onClick={handleGenerate}
                  disabled={submitting}
                  size="sm"
                  className={cn(
                    "h-10 w-10 rounded-full p-0 shrink-0 text-zinc-400 transition-colors",
                    {
                      search: "hover:bg-green-500/20 hover:text-green-400",
                      popular: "hover:bg-yellow-500/20 hover:text-yellow-400",
                      latest: "hover:bg-cyan-500/20 hover:text-cyan-400",
                      random: "hover:bg-purple-500/20 hover:text-purple-400",
                    }[mode]
                  )}
                >
                  {submitting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* ── Ingredient input ────────────────────────────────────── */}
              <div className="px-4 pb-3 flex items-center gap-2 border-t border-white/5 pt-3">
                <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Add ingredient (e.g. Tequila, Lime juice...)"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 outline-none"
                />
                {ingredientInput.trim() && (
                  <button
                    onClick={addIngredient}
                    className="text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/25 rounded-md px-2 py-1 transition-colors shrink-0"
                  >
                    + Add
                  </button>
                )}
              </div>

              {/* ── Filter bar ──────────────────────────────────────────── */}
              <div className="px-4 pb-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
                <Dropdown
                  label="Type"
                  value={alcoholic}
                  options={["Alcoholic", "Non alcoholic"]}
                  onChange={setAlcoholic}
                  placeholder="Any"
                />
                <Dropdown
                  label="Glass"
                  value={selectedGlass}
                  options={GLASS_TYPES}
                  onChange={setSelectedGlass}
                  placeholder="Any"
                />
                <Dropdown
                  label="Category"
                  value={selectedCategory}
                  options={CATEGORIES}
                  onChange={setSelectedCategory}
                  placeholder="Any"
                />
              </div>
            </>
          ) : (
            /* ── Non-search modes: inline with Go button ─────────────── */
            <div className="px-4 py-4">
              <div className="flex items-center justify-center gap-3">
                {mode === "popular" && (
                  <>
                    <Star className="h-5 w-5 text-yellow-400 shrink-0" />
                    <span className="text-zinc-300">
                      Fetch the most <span className="text-yellow-400 font-medium">popular</span> cocktails
                    </span>
                  </>
                )}
                {mode === "latest" && (
                  <>
                    <Clock className="h-5 w-5 text-cyan-400 shrink-0" />
                    <span className="text-zinc-300">
                      Fetch the <span className="text-cyan-400 font-medium">latest</span> added cocktails
                    </span>
                  </>
                )}
                {mode === "random" && (
                  <>
                    <Shuffle className="h-5 w-5 text-purple-400 shrink-0" />
                    <span className="text-zinc-300">Get</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={randomCount}
                      onChange={(e) =>
                        setRandomCount(Math.min(10, Math.max(1, Number(e.target.value) || 1)))
                      }
                      className="w-14 rounded-lg bg-zinc-800 border border-white/10 text-purple-400 px-2 py-1 text-sm outline-none text-center"
                    />
                    <span className="text-zinc-300">
                      <span className="text-purple-400 font-medium">random</span> cocktail{randomCount > 1 ? "s" : ""}
                    </span>
                  </>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={submitting}
                  className={cn(
                    "ml-6 rounded-full disabled:opacity-50 p-2 transition-colors shrink-0 text-zinc-400",
                    {
                      search: "hover:bg-green-500/20 hover:text-green-400",
                      popular: "hover:bg-yellow-500/20 hover:text-yellow-400",
                      latest: "hover:bg-cyan-500/20 hover:text-cyan-400",
                      random: "hover:bg-purple-500/20 hover:text-purple-400",
                    }[mode]
                  )}
                >
                  {submitting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Budget row (always visible) ────────────────────────── */}
          <div className="px-4 pb-4 border-t border-white/5 pt-3">
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-xs text-zinc-500 shrink-0">Budget:</span>
              <Slider
                value={budget}
                onValueChange={setBudget}
                min={50}
                max={10000}
                step={50}
                className="flex-1 [&_.slider-thumb]:bg-green-500 [&_.slider-thumb]:border-green-500 [&_.slider-range]:bg-green-500"
              />
              <span className="text-sm font-semibold text-green-400 w-20 text-right shrink-0">
                {budget[0]} CZK
              </span>
            </div>
          </div>
        </div>

        {/* ── Hint ─────────────────────────────────────────────────── */}
        {isSearch && (
          <p className="text-xs text-zinc-600 text-center mt-3">
            Press Enter to search · Add ingredients with the + row
          </p>
        )}
      </div>
    </div>
  );
}
