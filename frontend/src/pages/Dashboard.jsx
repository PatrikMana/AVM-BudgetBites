// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Plus, Sparkles, Calendar } from "lucide-react";
import { fuzzyMatch, ingredientImgUrl } from "../lib/ingredientMatch.js";

const Dashboard = () => {
  const { menuOpen, panelWidth } = useOutletContext() || { menuOpen: false, panelWidth: 0 };

  const [inventory, setInventory] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [validIngredients, setValidIngredients] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/cocktails/all-ingredients")
      .then(r => r.ok ? r.json() : [])
      .then(list => setValidIngredients(list.map(i => i.name).filter(Boolean)))
      .catch(() => {});
  }, []);

  const previousGenerations = [
    { id: 1, date: "2025-11-09", title: "Weekend Party Shots", budget: "$15", details: "12 shots" },
    { id: 2, date: "2025-11-08", title: "Margarita Night",     budget: "$20", details: "4 cocktails" },
    { id: 3, date: "2025-11-07", title: "Budget Mixes",        budget: "$10", details: "6 drinks" },
  ];

  const handleAddItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed || !newQuantity.trim()) return;
    setError(null);

    const match = validIngredients.length ? fuzzyMatch(trimmed, validIngredients) : trimmed;
    if (!match) {
      setError(`"${trimmed}" doesn't exist`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (inventory.some(i => i.name === match)) {
      setError(`${match} is already in your bar`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setInventory(prev => [...prev, {
      id: Date.now(),
      name: match,
      quantity: newQuantity.trim(),
      addedDate: new Date().toISOString().split("T")[0],
    }]);
    setNewItem("");
    setNewQuantity("");
  };

  const handleRemoveItem = (id) => {
    setInventory(inventory.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="flex">
        {/* Main Content */}
        <main
          className="flex-1 p-6 lg:p-12"
          style={{
            transform: menuOpen ? `translateX(${panelWidth / 2}px)` : "none",
            transition: "transform 300ms ease",
            willChange: "transform",
          }}
        >
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-zinc-400">
                Welcome back! Create your next amazing drink menu.
              </p>
            </div>

            {/* Generate New Drink Menu Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 backdrop-blur">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  Generate New Drink Menu
                </h3>
                <p className="text-zinc-400">
                  Create a drink menu based on your bar ingredients and budget
                </p>
              </div>
              <Link to="/generate">
                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500">
                  <Sparkles className="h-4 w-4" />
                  Start Generating
                </button>
              </Link>
            </div>

            {/* Previous Generations History */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-emerald-500" />
                <h2 className="text-2xl font-bold text-white">Generation History</h2>
              </div>

              <div className="space-y-4">
                {previousGenerations.map((gen) => (
                  <div key={gen.id} className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 backdrop-blur hover:border-emerald-500/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{gen.title}</h3>
                        <p className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                          <Calendar className="h-3 w-3" />
                          {gen.date}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-zinc-400">
                          Budget: <span className="text-white font-medium">{gen.budget}</span>
                        </div>
                        <div className="text-zinc-400">
                          Yield: <span className="text-white font-medium">{gen.details}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* My Bar Sidebar - RIGHT SIDE */}
        <aside className="hidden lg:block w-80 border-l border-white/10 bg-zinc-900/50 min-h-screen">
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">My Bar</h2>
              <p className="text-sm text-zinc-400">What you have at home</p>
            </div>

            {/* Add Item Form */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4 backdrop-blur space-y-3">
              <input
                placeholder="Ingredient name (e.g. Vodka, Lime)"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                className="w-full rounded-xl border border-white/10 bg-zinc-800/60 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <input
                placeholder="Quantity (e.g. 1L, 50ml, 3pcs)"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                className="w-full rounded-xl border border-white/10 bg-zinc-800/60 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
              {error && <div className="text-xs text-red-400">{error}</div>}
            </div>

            {/* Inventory List */}
            <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
              {inventory.length === 0 && (
                <div className="text-center py-8 text-sm text-zinc-500">
                  Your bar is empty. Add an ingredient above.
                </div>
              )}
              {inventory.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-zinc-900/80 p-4 backdrop-blur">
                  <div className="flex items-start gap-3">
                    <img
                      src={ingredientImgUrl(item.name, "small")}
                      alt={item.name}
                      className="h-10 w-10 object-contain shrink-0"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{item.name}</p>
                      <p className="text-sm text-zinc-400">{item.quantity}</p>
                      <p className="text-xs text-zinc-500 mt-1">Added: {item.addedDate}</p>
                    </div>
                    <button
                      className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label="Remove item"
                    >
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="4" y1="4" x2="16" y2="16" />
                        <line x1="16" y1="4" x2="4" y2="16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
