import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import CocktailGeneratorPanel from "../components/CocktailGeneratorPanel.jsx";
import CocktailResults from "../components/CocktailResults.jsx";
import { authFetch } from "../lib/auth.js";

export default function Generate() {
  const { menuOpen, panelWidth } = useOutletContext() || { menuOpen: false, panelWidth: 0 };
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paywall, setPaywall] = useState(null);
  const [glassMap, setGlassMap] = useState({});       // name → id
  const [categoryMap, setCategoryMap] = useState({}); // name → id
  const resultsRef = useRef(null);

  useEffect(() => {
    const buildMap = (list) => {
      const m = {};
      list.forEach(x => { m[x.name] = x.id; });
      return m;
    };
    authFetch("/api/cocktails/glasses")
      .then(r => r.ok ? r.json() : [])
      .then(list => setGlassMap(buildMap(list)))
      .catch(() => {});
    authFetch("/api/cocktails/categories")
      .then(r => r.ok ? r.json() : [])
      .then(list => setCategoryMap(buildMap(list)))
      .catch(() => {});
  }, []);

  const handleGenerate = async (filters) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setPaywall(null);

    try {
      let data = [];

      if (filters.mode === "popular" || filters.mode === "latest") {
        setPaywall(filters.mode);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        return;
      }

      if (filters.mode === "random") {
        const count = Math.min(10, Math.max(1, filters.count || 1));
        const calls = Array.from({ length: count }, () =>
          authFetch("/api/cocktails/random").then(r => r.ok ? r.json() : null)
        );
        const responses = await Promise.all(calls);
        data = responses.filter(Boolean);
      } else {
        const ings = filters.ingredients || [];
        let lists = [];

        if (ings.length) {
          // Fetch cocktails per ingredient, intersect (must contain ALL)
          const ingResponses = await Promise.all(
            ings.map(i =>
              authFetch(`/api/cocktails/ingredient/search?name=${encodeURIComponent(i)}`)
                .then(r => r.ok ? r.json() : [])
            )
          );
          lists.push(...ingResponses);
        }

        if (filters.name) {
          const res = await authFetch(`/api/cocktails/search?name=${encodeURIComponent(filters.name)}`);
          if (!res.ok) throw new Error(`Server error ${res.status}`);
          lists.push(await res.json());
        }

        if (filters.glass && glassMap[filters.glass]) {
          const res = await authFetch(`/api/cocktails/glass/${glassMap[filters.glass]}`);
          if (res.ok) lists.push(await res.json());
        }

        if (filters.category && categoryMap[filters.category]) {
          const res = await authFetch(`/api/cocktails/category/${categoryMap[filters.category]}`);
          if (res.ok) lists.push(await res.json());
        }

        if (lists.length === 0) {
          data = [];
        } else {
          // Intersect by id
          const idSets = lists.map(l => new Set(l.map(c => c.id)));
          const baseList = lists[0];
          data = baseList.filter(c => idSets.every(s => s.has(c.id)));
        }

        // Remaining filter still applied client-side
        if (filters.alcoholic) data = data.filter(c => c.alcoholicType === filters.alcoholic);
      }

      setResults(data);
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
          {paywall && (
            <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent p-8 text-center">
              {/* TODO: DELETE LATER — placeholder under-construction image */}
              <img
                src="https://c8.alamy.com/comp/2B77KHJ/3d-under-construction-concept-2B77KHJ.jpg"
                alt="Under construction"
                className="mx-auto mb-4 max-h-48 rounded-lg"
              />
              {/* END DELETE LATER */}
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {paywall === "popular" ? "Popular cocktails" : "Latest additions"} is a premium feature
              </h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto mb-5">
                Subscribe to <span className="text-yellow-400 font-semibold">BudgetShots</span> to unlock {paywall === "popular" ? "trending" : "the latest"} cocktails and more.
              </p>
              <button className="rounded-xl bg-yellow-500 hover:bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors">
                Subscribe to BudgetShots
              </button>
            </div>
          )}
          {results !== null && (
            <CocktailResults cocktails={results} />
          )}
        </div>
      </div>
    </main>
  );
}
