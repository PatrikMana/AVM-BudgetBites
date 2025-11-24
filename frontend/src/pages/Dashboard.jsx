// src/pages/Dashboard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Sparkles, Calendar, X } from "lucide-react";
import { useOutletContext } from "react-router-dom";

const Dashboard = () => {
  const { menuOpen, panelWidth } = useOutletContext() || { menuOpen: false, panelWidth: 0 };
  
  const [inventory, setInventory] = useState([
    { id: 1, name: "Chicken Breast", quantity: "500g", addedDate: "2025-11-08" },
    { id: 2, name: "Tomatoes", quantity: "6pcs", addedDate: "2025-11-09" },
    { id: 3, name: "Pasta", quantity: "250g", addedDate: "2025-11-07" },
    { id: 4, name: "Onions", quantity: "3pcs", addedDate: "2025-11-08" },
    { id: 5, name: "Cheese", quantity: "200g", addedDate: "2025-11-10" },
  ]);

  const [newItem, setNewItem] = useState("");
  const [newQuantity, setNewQuantity] = useState("");

  const previousGenerations = [
    {
      id: 1,
      date: "2025-11-09",
      title: "Mediterranean Dinner",
      budget: "$5",
      calories: "450 kcal",
    },
    {
      id: 2,
      date: "2025-11-08",
      title: "Quick Weekend Lunch",
      budget: "$4",
      calories: "380 kcal",
    },
    {
      id: 3,
      date: "2025-11-07",
      title: "Family Dinner for 4",
      budget: "$10",
      calories: "520 kcal",
    },
  ];

  const handleAddItem = () => {
    if (newItem.trim() && newQuantity.trim()) {
      setInventory([
        ...inventory,
        {
          id: Date.now(),
          name: newItem,
          quantity: newQuantity,
          addedDate: new Date().toISOString().split("T")[0],
        },
      ]);
      setNewItem("");
      setNewQuantity("");
    }
  };

  const handleRemoveItem = (id) => {
    setInventory(inventory.filter((item) => item.id !== id));
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
                Welcome back! Create your next delicious meal plan.
              </p>
            </div>

            {/* Generate New Meal Plan Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 backdrop-blur">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  Generate New Meal Plan
                </h3>
                <p className="text-zinc-400">
                  Create a meal plan based on current deals and your budget
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
                          Calories: <span className="text-white font-medium">{gen.calories}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Food Inventory Sidebar - RIGHT SIDE */}
        <aside className="hidden lg:block w-80 border-l border-white/10 bg-zinc-900/50 min-h-screen">
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">My Inventory</h2>
              <p className="text-sm text-zinc-400">
                What you have at home
              </p>
            </div>

            {/* Add Item Form */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4 backdrop-blur space-y-3">
              <input
                placeholder="Food name"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-800/60 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <input
                placeholder="Quantity (e.g. 500g, 3pcs)"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-800/60 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {/* Inventory List */}
            <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
              {inventory.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-zinc-900/80 p-4 backdrop-blur">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-sm text-zinc-400">
                        {item.quantity}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Added: {item.addedDate}
                      </p>
                    </div>
                    <button
                      className="h-8 w-8 rounded-lg hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition flex items-center justify-center"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <X className="h-4 w-4" />
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
