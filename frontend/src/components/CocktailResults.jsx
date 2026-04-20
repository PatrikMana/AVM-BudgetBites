import { useState } from "react";
import { Wine, ChevronDown, ChevronUp, Beaker } from "lucide-react";
import { cn } from "../lib/utils";

function CocktailCard({ cocktail }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      "rounded-2xl border border-white/10 bg-zinc-900/80 overflow-hidden transition-all",
      expanded && "ring-1 ring-purple-500/30"
    )}>
      {/* Top: image + header */}
      <div className="flex gap-4 p-4">
        <img
          src={cocktail.imageSmall || cocktail.imageUrl}
          alt={cocktail.name}
          className="w-20 h-20 rounded-xl object-cover shrink-0 bg-zinc-800"
          onError={e => { e.currentTarget.src = ""; e.currentTarget.style.display = "none"; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-base leading-tight truncate">{cocktail.name}</h3>
              {cocktail.nameAlternate && (
                <p className="text-zinc-500 text-xs mt-0.5 truncate">also: {cocktail.nameAlternate}</p>
              )}
            </div>
            <span className={cn(
              "shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border",
              cocktail.alcoholicType === "Alcoholic"
                ? "text-purple-400 border-purple-500/30 bg-purple-500/10"
                : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
            )}>
              {cocktail.alcoholicType === "Alcoholic" ? "Alcoholic" : "Non-alc"}
            </span>
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800 rounded-md px-2 py-0.5">
              <Wine className="h-3 w-3 text-zinc-500" />
              {cocktail.glass}
            </span>
            <span className="text-[11px] text-zinc-400 bg-zinc-800 rounded-md px-2 py-0.5">
              {cocktail.category}
            </span>
          </div>

          {/* Ingredients preview */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {cocktail.ingredients.slice(0, 4).map(ing => (
              <div key={ing.ingredientId} className="flex items-center gap-1 text-[11px] text-zinc-300">
                <img
                  src={ing.imageSmall}
                  alt={ing.ingredientName}
                  className="h-4 w-4 object-contain"
                  onError={e => { e.currentTarget.style.display = "none"; }}
                />
                <span>{ing.measure ? `${ing.measure} ${ing.ingredientName}` : ing.ingredientName}</span>
              </div>
            ))}
            {cocktail.ingredients.length > 4 && (
              <span className="text-[11px] text-zinc-500">+{cocktail.ingredients.length - 4} more</span>
            )}
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-2 border-t border-white/5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-colors"
      >
        <span>{expanded ? "Hide details" : "Show details"}</span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {/* Expanded: all ingredients + instructions */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5">
          {/* All ingredients */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-3 mb-2">Ingredients</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cocktail.ingredients.map(ing => (
                <div key={ing.ingredientId} className="flex items-center gap-2.5 bg-zinc-800/60 rounded-lg px-3 py-2">
                  <img
                    src={ing.imageSmall}
                    alt={ing.ingredientName}
                    className="h-8 w-8 object-contain shrink-0"
                    onError={e => { e.currentTarget.style.display = "none"; }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm text-white font-medium truncate">{ing.ingredientName}</div>
                    {ing.measure && <div className="text-xs text-zinc-400">{ing.measure}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          {cocktail.instructions && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Instructions</div>
              <p className="text-sm text-zinc-300 leading-relaxed">{cocktail.instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CocktailResults({ cocktails }) {
  if (cocktails.length === 0) {
    return (
      <div className="text-center py-16">
        <Beaker className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500">No cocktails found. Try a different search.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 mt-2">
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-xs text-zinc-500">{cocktails.length} result{cocktails.length !== 1 ? "s" : ""}</span>
        <div className="h-px flex-1 bg-white/5" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cocktails.map(c => (
          <CocktailCard key={c.id} cocktail={c} />
        ))}
      </div>
    </div>
  );
}
