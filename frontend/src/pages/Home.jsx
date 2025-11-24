// src/pages/Home.jsx
import { Link, Navigate } from "react-router-dom";
import { Sparkles, TrendingDown, BookOpen, ArrowRight, Check } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import Cookies from "js-cookie";

export default function Home() {
    const { menuOpen, panelWidth } = useOutletContext() || { menuOpen: false, panelWidth: 0 };
    
    // If user is logged in, redirect to dashboard
    const username = Cookies.get("username");
    if (username) {
        return <Navigate to="/dashboard" replace />;
    }

    const features = [
        {
            icon: TrendingDown,
            title: "Automatic Deal Tracking",
            description: "Uses KupiAPI to track weekly deals in stores",
        },
        {
            icon: Sparkles,
            title: "Smart Meal Suggestions",
            description: "Meal planner based on your budget",
        },
        {
            icon: BookOpen,
            title: "Save Recipes & Lists",
            description: "Store your favorite recipes and shopping lists",
        },
    ];

    const pricingPlans = [
        {
            name: "Free",
            price: "$0",
            description: "Perfect for trying out",
            features: [
                "Basic deal tracking",
                "3 recipes per month",
                "Simple shopping lists",
            ],
            cta: "Start Free",
            link: "/login",
            isOutline: true,
        },
        {
            name: "Premium",
            price: "$2.99 / month",
            description: "Advanced planning and notifications",
            features: [
                "Unlimited recipes",
                "Advanced meal planning",
                "Personalized deal notifications",
                "Export shopping lists",
                "Priority support",
            ],
            cta: "Go Premium",
            link: "/login",
            isOutline: false,
        },
    ];

    return (
        <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
            <div
                style={{
                    transform: menuOpen ? `translateX(${panelWidth / 2}px)` : "none",
                    transition: "transform 300ms ease",
                    willChange: "transform",
                }}
            >
                {/* Hero Section */}
                <section className="min-h-screen flex items-center justify-center px-4 py-20">
                <div className="max-w-4xl text-center">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full mb-6 border border-emerald-500/20">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-medium">Save on your food shopping</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
                        Budget<span className="text-emerald-500">Bites</span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-2xl mx-auto">
                        Smart meal planning based on current deals
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/generate"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
                        >
                            Start Planning
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-6 py-3 text-lg font-semibold text-white backdrop-blur transition hover:bg-zinc-800/90"
                        >
                            Sign In
                        </Link>
                    </div>

                    {/* Decorative pattern */}
                    <div className="mt-20 relative -z-10">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                            <div className="w-96 h-96 border-2 border-emerald-500 rounded-full" />
                            <div className="w-72 h-72 border-2 border-emerald-500 rounded-full absolute" />
                            <div className="w-48 h-48 border-2 border-emerald-500 rounded-full absolute" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-4 py-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            How it <span className="text-emerald-500">works</span>
                        </h2>
                        <p className="text-zinc-400 text-lg">
                            Three simple steps to save on food
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 backdrop-blur transition-colors hover:border-emerald-500/50"
                            >
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                                    <feature.icon className="h-6 w-6 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-zinc-400 text-base">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="px-4 py-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            <span className="text-emerald-500">Pricing</span>
                        </h2>
                        <p className="text-zinc-400 text-lg">
                            Choose the plan that suits you
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {pricingPlans.map((plan, index) => (
                            <div
                                key={index}
                                className={`rounded-2xl border ${
                                    plan.isOutline ? 'border-white/10' : 'border-emerald-500/50'
                                } bg-zinc-900/80 p-6 backdrop-blur`}
                            >
                                <div className="mb-6">
                                    <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                                    <div className="text-3xl font-bold text-white mt-4">{plan.price}</div>
                                    <p className="text-zinc-400 text-base mt-2">
                                        {plan.description}
                                    </p>
                                </div>
                                
                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-zinc-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                
                                <Link
                                    to={plan.link}
                                    className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
                                        plan.isOutline
                                            ? 'border border-white/10 bg-zinc-800/60 text-white hover:bg-zinc-800/90'
                                            : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500'
                                    }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 px-4 py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-emerald-500" />
                            <span className="font-semibold text-white">BudgetBites</span>
                        </div>

                        <nav className="flex gap-6 text-sm">
                            <Link to="/" className="text-zinc-400 hover:text-emerald-500 transition-colors">
                                Home
                            </Link>
                            <Link to="/generate" className="text-zinc-400 hover:text-emerald-500 transition-colors">
                                Generator
                            </Link>
                            <Link to="/login" className="text-zinc-400 hover:text-emerald-500 transition-colors">
                                Sign In
                            </Link>
                        </nav>

                        <p className="text-sm text-zinc-500">
                            © 2025 BudgetBites. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
            </div>
        </div>
    );
}
