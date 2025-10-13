import { useState } from "react";
import {
    Sparkles,
    DollarSign,
    Zap,
    ChefHat,
    Users,
    Gauge,
} from "lucide-react";

export default function RecipeGeneratorPanel({ onGenerate }) {
    const [form, setForm] = useState({
        budget: 6,
        calories: 2,
        cuisine: "Mediterranean",
        servings: 6,
        difficulty: "medium",
    });
    const [submitting, setSubmitting] = useState(false);

    const cuisineOptions = [
        "Mediterranean",
        "Italian",
        "Mexican",
        "Indian",
        "Thai",
        "Japanese",
        "Middle Eastern",
        "American",
        "Vegetarian",
        "Vegan",
    ];

    const difficultyOptions = [
        { value: "easy", label: "Easy (20 min)" },
        { value: "medium", label: "Medium (45 min)" },
        { value: "hard", label: "Hard (90+ min)" },
    ];

    const servingOptions = Array.from({ length: 12 }, (_, i) => i + 1);

    function update(name, value) {
        setForm((f) => ({ ...f, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        const payload = {
            ...form,
            budget: Number(form.budget),
            calories: Number(form.calories),
            servings: Number(form.servings),
        };

        try {
            // Předání dat rodiči nebo ukázkový fallback:
            if (typeof onGenerate === "function") {
                await onGenerate(payload);
            } else {
                // fallback demo
                // eslint-disable-next-line no-alert
                alert(`Generate with:\n${JSON.stringify(payload, null, 2)}`);
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur">
                {/* Header */}
                <div className="mb-6 flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/30">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Recipe Generator</h2>
                        <p className="text-sm text-zinc-400">Tell us what you&apos;re craving</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Budget */}
                        <Field label="Maximum Budget ($)" icon={<DollarSign className="h-4 w-4" />}>
                            <input
                                type="number"
                                min={0}
                                step="0.5"
                                inputMode="decimal"
                                className="w-full rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
                                value={form.budget}
                                onChange={(e) => update("budget", e.target.value)}
                                placeholder="e.g., 10"
                                aria-label="Maximum Budget in dollars"
                                required
                            />
                        </Field>

                        {/* Calories */}
                        <Field label="Max Calories/Serving" icon={<Zap className="h-4 w-4" />}>
                            <input
                                type="number"
                                min={0}
                                step="1"
                                inputMode="numeric"
                                className="w-full rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
                                value={form.calories}
                                onChange={(e) => update("calories", e.target.value)}
                                placeholder="e.g., 500"
                                aria-label="Maximum calories per serving"
                                required
                            />
                        </Field>

                        {/* Cuisine */}
                        <Field label="Cuisine Type" icon={<ChefHat className="h-4 w-4" />}>
                            <select
                                className="w-full appearance-none rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                value={form.cuisine}
                                onChange={(e) => update("cuisine", e.target.value)}
                                aria-label="Cuisine type"
                            >
                                {cuisineOptions.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* Servings */}
                        <Field label="Servings" icon={<Users className="h-4 w-4" />}>
                            <select
                                className="w-full appearance-none rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                value={form.servings}
                                onChange={(e) => update("servings", e.target.value)}
                                aria-label="Servings"
                            >
                                {servingOptions.map((n) => (
                                    <option key={n} value={n}>
                                        {n} {n === 1 ? "person" : "people"}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* Difficulty */}
                        <Field label="Difficulty" icon={<Gauge className="h-4 w-4" />}>
                            <select
                                className="w-full appearance-none rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                value={form.difficulty}
                                onChange={(e) => update("difficulty", e.target.value)}
                                aria-label="Difficulty"
                            >
                                {difficultyOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <Sparkles className="h-5 w-5" />
                            Generate Perfect Recipe
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/** Small labeled field with an icon */
function Field({ label, icon, children }) {
    return (
        <label className="block">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-zinc-300">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 ring-1 ring-white/10">
          {icon}
        </span>
                {label}
            </div>
            {children}
        </label>
    );
}
