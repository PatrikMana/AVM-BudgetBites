import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Badge } from "./ui/badge";
import { 
  Flame, 
  Utensils, 
  ShoppingBag, 
  CalendarDays,
  Wheat,
  Milk,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { cn } from "../lib/utils";
import { format } from "date-fns";

const dietOptions = [
  { id: "gluten-free", label: "Gluten-free diet", icon: Wheat },
  { id: "lactose-free", label: "Lactose-free diet", icon: Milk },
  { id: "nut-allergy", label: "Nut allergy", icon: AlertCircle },
  { id: "egg-allergy", label: "Egg allergy", icon: AlertCircle },
  { id: "soy-allergy", label: "Soy allergy", icon: AlertCircle },
];

const storeOptions = [
  { id: "albert", name: "Albert" },
  { id: "lidl", name: "Lidl" },
  { id: "kaufland", name: "Kaufland" },
  { id: "billa", name: "Billa" },
  { id: "tesco", name: "Tesco" },
  { id: "penny", name: "Penny Market"},
  { id: "globus", name: "Globus" },
  { id: "makro", name: "Makro" },
];

// Mapping store id -> domain used for fetching logos. You can replace the
// logo provider or these domains with local assets if you prefer.
const storeDomains = {
  albert: "albert.cz",
  lidl: "lidl.cz",
  kaufland: "kaufland.cz",
  billa: "billa.com", 
  tesco: "tesco.com",
  penny: "penny.cz", format: "png",
  globus: "globus.cz",
  makro: "makro.cz",
};

// Logo.dev API configuration
const LOGO_DEV_PUBLIC_KEY = 'pk_VeJUHnpITreru4erioI9Ng';

function getStoreLogoUrl(storeId) {
  const domain = storeDomains[storeId];
  if (!domain) return null;
  // Using Logo.dev API for brand logos with the provided token
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_PUBLIC_KEY}`;
}

const mealCountOptions = [
  { value: 3, label: "3 meals", description: "Breakfast, lunch, dinner" },
  { value: 4, label: "4 meals", description: "+ 1 snack" },
  { value: 5, label: "5 meals", description: "+ 2 snacks" },
  { value: 6, label: "6 meals", description: "+ 3 snacks" },
];

export default function RecipeGeneratorPanel({ onGenerate }) {
  const [calories, setCalories] = useState([2000]);
  const [mealCount, setMealCount] = useState(3);
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleDiet = (dietId) => {
    setSelectedDiets((prev) =>
      prev.includes(dietId)
        ? prev.filter((id) => id !== dietId)
        : [...prev, dietId]
    );
  };

  const toggleStore = (storeId) => {
    setSelectedStores((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId]
    );
  };

  const handleGenerate = async () => {
    setSubmitting(true);
    const payload = {
      calories: calories[0],
      mealCount,
      selectedDiets,
      selectedStores,
      selectedDates,
    };

    try {
      // Pass data to parent or example fallback:
      if (typeof onGenerate === "function") {
        await onGenerate(payload);
      } else {
        // fallback demo
        console.log(payload);
        alert(`Generate with:\n${JSON.stringify(payload, null, 2)}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 border border-emerald-500/20">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Meal Plan Generator</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Create your healthy <span className="text-emerald-500">meal plan</span>
          </h1>
          <p className="text-zinc-400">
            Set your preferences and let us create a personalized nutrition plan for you
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Calories Card */}
          <Card className="bg-zinc-900/80 border-white/10 backdrop-blur transition-all hover:border-emerald-500/50 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <div className="rounded-lg bg-emerald-500/15 p-2 ring-1 ring-emerald-500/30">
                  <Flame className="h-5 w-5 text-emerald-400" />
                </div>
                Daily Calories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-4xl font-bold text-emerald-500">{calories[0]}</span>
                  <span className="ml-1 text-zinc-400">kcal</span>
                </div>
                <Slider
                  value={calories}
                  onValueChange={setCalories}
                  min={1000}
                  max={4000}
                  step={50}
                  className="mt-4 [&_.slider-thumb]:bg-emerald-500 [&_.slider-thumb]:border-emerald-500 [&_.slider-range]:bg-emerald-500"
                />
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>1000 kcal</span>
                  <span>4000 kcal</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meal Count Card */}
          <Card className="bg-zinc-900/80 border-white/10 backdrop-blur transition-all hover:border-emerald-500/50 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <div className="rounded-lg bg-emerald-500/15 p-2 ring-1 ring-emerald-500/30">
                  <Utensils className="h-5 w-5 text-emerald-400" />
                </div>
                Meals per Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {mealCountOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMealCount(option.value)}
                    className={cn(
                      "rounded-xl border-2 p-3 text-left transition-all",
                      mealCount === option.value
                        ? "border-emerald-500 bg-emerald-500/10 text-white shadow-lg shadow-emerald-900/30"
                        : "border-white/10 bg-zinc-800/60 text-zinc-400 hover:border-emerald-500/50 hover:text-white"
                    )}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-xs text-zinc-500">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Diet Preferences Card */}
          <Card className="bg-zinc-900/80 border-white/10 backdrop-blur transition-all hover:border-emerald-500/50 shadow-xl md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <div className="rounded-lg bg-red-500/15 p-2 ring-1 ring-red-500/30">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                Diets and Allergies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dietOptions.map((diet) => {
                  const Icon = diet.icon;
                  return (
                    <div
                      key={diet.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer",
                        selectedDiets.includes(diet.id)
                          ? "border-emerald-500 bg-emerald-500/10 text-white"
                          : "border-white/10 bg-zinc-800/60 text-zinc-400 hover:border-emerald-500/50 hover:text-white"
                      )}
                      onClick={() => toggleDiet(diet.id)}
                    >
                      {/* <Checkbox
                        id={diet.id}
                        checked={selectedDiets.includes(diet.id)}
                        onCheckedChange={() => toggleDiet(diet.id)}
                        className="border-zinc-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      /> */}
                      <Icon className="h-4 w-4 text-zinc-500" />
                      <Label htmlFor={diet.id} className="cursor-pointer flex-1 text-inherit">
                        {diet.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Calendar Card */}
          <Card className="bg-zinc-900/80 border-white/10 backdrop-blur transition-all hover:border-emerald-500/50 shadow-xl md:col-span-2 lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <div className="rounded-lg bg-emerald-500/15 p-2 ring-1 ring-emerald-500/30">
                  <CalendarDays className="h-5 w-5 text-emerald-400" />
                </div>
                Planning Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => setSelectedDates(dates || [])}
                  className="rounded-xl border border-white/10 bg-zinc-800/60 p-3 text-white [&_.rdp-day]:text-zinc-400 [&_.rdp-day_selected]:bg-emerald-500 [&_.rdp-day_selected]:text-white [&_.rdp-day:hover]:bg-emerald-500/20"
                  numberOfMonths={2}
                />
                {selectedDates.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-sm text-zinc-400">Selected:</span>
                    <Badge className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                      {selectedDates.length} {selectedDates.length === 1 ? "day" : selectedDates.length < 5 ? "days" : "days"}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stores Card */}
          <Card className="bg-zinc-900/80 border-white/10 backdrop-blur transition-all hover:border-emerald-500/50 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <div className="rounded-lg bg-blue-500/15 p-2 ring-1 ring-blue-500/30">
                  <ShoppingBag className="h-5 w-5 text-blue-400" />
                </div>
                Stores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {storeOptions.map((store) => {
                  const logoUrl = getStoreLogoUrl(store.id);
                  return (
                    <div
                      key={store.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer",
                        selectedStores.includes(store.id)
                          ? "border-emerald-500 bg-emerald-500/10 text-white"
                          : "border-white/10 bg-zinc-800/60 text-zinc-400 hover:border-emerald-500/50 hover:text-white"
                      )}
                      onClick={() => toggleStore(store.id)}
                    >
                      {/* optional checkbox could be re-enabled here */}
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={`${store.name} logo`}
                          className="h-6 w-6 flex-shrink-0 rounded object-contain"
                          onError={(e) => {
                            // hide broken logo images
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-6 w-6 flex-shrink-0 rounded bg-zinc-800/40 flex items-center justify-center text-xs text-zinc-400">
                          {store.name.slice(0,1)}
                        </div>
                      )}
                      <Label htmlFor={store.id} className="cursor-pointer flex-1 text-inherit">
                        {store.name}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={handleGenerate}
            disabled={submitting}
            size="lg"
            className="h-14 px-12 text-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {submitting ? "Generating..." : "Generate Meal Plan"}
          </Button>
          <p className="mt-3 text-sm text-zinc-400">
            Based on your preferences, we will create a personalized plan
          </p>
        </div>
      </div>
    </div>
  );
}
