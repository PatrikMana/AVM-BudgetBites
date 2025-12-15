// src/pages/Account.jsx
import { User, Mail, Crown, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { getUserData, logout } from "../lib/auth";

const Account = () => {
    const { menuOpen, panelWidth } = useOutletContext() || { menuOpen: false, panelWidth: 0 };
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);

    // Get user data from auth utility
    const userData = getUserData();
    const username = userData.username || "Guest";
    const email = userData.email || "guest@example.com";
    const [userPlan, setUserPlan] = useState(Cookies.get("plan") || "free");

    const user = {
        email: email,
        username: username,
        plan: userPlan,
        joinedDate: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
    };

    const handleUpgradeToPremium = () => {
        // Upgrade to premium
        setUserPlan("premium");
        Cookies.set("plan", "premium", {
            expires: 7,
            secure: false,
            sameSite: "Strict",
        });
    };

    const handleLogout = () => {
        logout(false); // Don't auto-redirect
        navigate("/login");
    };

    const handleSave = () => {
        setIsEditing(false);
        // Add save logic here - API call to update user info
        console.log("Saving changes...");
    };

    // Premium theme colors
    const isPremium = user.plan === "premium";
    const accentColor = isPremium ? "amber-500" : "emerald-500";
    const bgAccent = isPremium ? "amber-500/10" : "emerald-500/10";
    const borderAccent = isPremium ? "amber-500/20" : "emerald-500/20";
    const textAccent = isPremium ? "amber-400" : "emerald-400";
    const shadowAccent = isPremium ? "amber-900/30" : "emerald-900/30";

    return (
        <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
            <main 
                className="px-4 py-8 md:py-12"
                style={{
                    transform: menuOpen ? `translateX(${panelWidth / 2}px)` : "none",
                    transition: "transform 300ms ease",
                    willChange: "transform",
                }}
            >
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Profile Header */}
                    <div className={`rounded-2xl border ${isPremium ? 'border-amber-500/30 bg-gradient-to-br from-zinc-900/90 to-amber-950/20' : 'border-white/10 bg-zinc-900/80'} p-6 backdrop-blur ${isPremium ? 'shadow-xl shadow-amber-500/5' : ''}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`h-20 w-20 rounded-full bg-${bgAccent} border border-${borderAccent} flex items-center justify-center ${isPremium ? 'shadow-lg shadow-amber-500/20' : ''}`}>
                                    <span className={`text-${textAccent} text-3xl font-semibold`}>
                                        {user.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                                        {user.username}
                                        {isPremium && <Crown className="h-5 w-5 text-amber-400" />}
                                    </h2>
                                    <p className="flex items-center gap-2 mt-1 text-zinc-400">
                                        <Mail className="h-4 w-4" />
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                            <span 
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                                    isPremium
                                        ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10" 
                                        : "bg-zinc-800/60 text-zinc-300 border border-white/10"
                                }`}
                            >
                                {isPremium && <Crown className="h-3 w-3" />}
                                {isPremium ? "Premium" : "Free"}
                            </span>
                        </div>
                    </div>

                    {/* Account Info */}
                    <div className={`rounded-2xl border ${isPremium ? 'border-amber-500/20' : 'border-white/10'} bg-zinc-900/80 p-6 backdrop-blur`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <User className={`h-5 w-5 text-${textAccent}`} />
                                <h3 className="text-xl font-semibold text-white">Account Information</h3>
                            </div>
                            <button
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition"
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                <Settings className="h-4 w-4" />
                                {isEditing ? "Cancel" : "Edit"}
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Username</label>
                                <input
                                    className={`w-full rounded-xl border px-4 py-2.5 text-white ${
                                        isEditing 
                                            ? "bg-zinc-800/60 border-white/10 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                                            : "bg-zinc-800/30 border-white/5 cursor-not-allowed"
                                    }`}
                                    defaultValue={user.username}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Email</label>
                                <input
                                    type="email"
                                    className={`w-full rounded-xl border px-4 py-2.5 text-white ${
                                        isEditing 
                                            ? "bg-zinc-800/60 border-white/10 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                                            : "bg-zinc-800/30 border-white/5 cursor-not-allowed"
                                    }`}
                                    defaultValue={user.email}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Member Since</label>
                                <input
                                    className="w-full rounded-xl border bg-zinc-800/30 border-white/5 px-4 py-2.5 text-white cursor-not-allowed"
                                    value={user.joinedDate}
                                    disabled
                                />
                            </div>
                            {isEditing && (
                                <button 
                                    onClick={handleSave}
                                    className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
                                >
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Subscription Card */}
                    <div className={`rounded-2xl border ${isPremium ? 'border-amber-500/20' : 'border-white/10'} bg-zinc-900/80 p-6 backdrop-blur`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Crown className={`h-5 w-5 text-${textAccent}`} />
                            <h3 className="text-xl font-semibold text-white">Subscription</h3>
                        </div>
                        <p className="text-zinc-400 mb-4">
                            {isPremium
                                ? "You have an active Premium subscription"
                                : "You're using the free version"}
                        </p>
                        {!isPremium ? (
                            <>
                                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-3 mb-4">
                                    <div className="font-semibold text-white">Premium Benefits:</div>
                                    <ul className="space-y-2 text-sm text-zinc-400">
                                        <li className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            Advanced meal planning
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            New deal notifications
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            Unlimited saved recipes
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            Priority support
                                        </li>
                                    </ul>
                                </div>
                                <button 
                                    onClick={handleUpgradeToPremium}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:from-amber-400 hover:to-yellow-400"
                                >
                                    <Crown className="h-4 w-4" />
                                    Upgrade to Premium - $2.99/month
                                </button>
                            </>
                        ) : (
                            <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/30 p-4">
                                <p className="text-sm text-amber-200/80 mb-4">
                                    ✨ Your Premium subscription is active. Thank you for your support!
                                </p>
                                <div className="h-px bg-amber-500/20 my-4" />
                                <button className="w-full rounded-xl border border-amber-500/30 bg-zinc-800/60 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:bg-zinc-800/90">
                                    Manage Subscription
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Logout */}
                    <div className="rounded-2xl border border-red-500/30 bg-zinc-900/80 p-6 backdrop-blur">
                        <button
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            Log Out
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Account;
