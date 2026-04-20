import { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import CocktailGeneratorPanel from "../components/CocktailGeneratorPanel.jsx";
import CocktailResults from "../components/CocktailResults.jsx";
import { authFetch } from "../lib/auth.js";

export default function Generate() {
  const { menuOpen, panelWidth } = useOutletContext() || { menuOpen: false, panelWidth: 0 };
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);

  const handleGenerate = async (filters) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const params = new URLSearchParams();
      if (filters.name)       params.set("name", filters.name);
      if (filters.glass)      params.set("glass", filters.glass);
      if (filters.alcoholic)  params.set("alcoholic", filters.alcoholic);
      if (filters.category)   params.set("category", filters.category);
      if (filters.ingredients?.length) {
        filters.ingredients.forEach(i => params.append("ingredient", i));
      }

      const res = await authFetch(`/api/cocktails/search?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);

      // Scroll to results
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-zinc-950">
      <div
        style={{
          transform: menuOpen ? `translateX(${panelWidth / 2}px)` : "none",
          transition: "transform 300ms ease",
          willChange: "transform",
        }}
      >
        <CocktailGeneratorPanel onGenerate={handleGenerate} loading={loading} />

        {/* Results */}
        <div ref={resultsRef} className="px-4 pb-16 max-w-6xl mx-auto">
          {error && (
            <div className="text-center py-10 text-red-400 text-sm">{error}</div>
          )}
          {results !== null && (
            <CocktailResults cocktails={results} />
          )}
        </div>
      </div>
    </main>
  );
}
