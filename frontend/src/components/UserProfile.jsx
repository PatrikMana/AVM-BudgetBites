// src/components/UserProfile.jsx
import React from 'react';
import { Crown, LogOut } from 'lucide-react';
import { getUserData, logout } from '../lib/auth';
import Cookies from 'js-cookie';

const UserProfile = ({ onClick, className = '' }) => {
    const userData = getUserData();
    const userPlan = Cookies.get("plan") || "free";
    
    // Don't render if not authenticated
    if (!userData.username) {
        return null;
    }

    // Premium theme colors - same as Account component
    const isPremium = userPlan === "premium";
    const bgAccent = isPremium ? "amber-500/20" : "emerald-500/20";
    const borderAccent = isPremium ? "amber-500/30" : "emerald-500/30";
    const textAccent = isPremium ? "amber-400" : "emerald-400";

    // Handle logout click
    const handleLogout = (e) => {
        e.stopPropagation(); // Prevent profile click
        logout(true); // Logout and redirect to login
    };

    return (
        <div 
            className={`user-profile cursor-pointer hover:bg-zinc-800/50 transition-colors duration-200 rounded-lg p-3 ${className}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            aria-label={`Go to ${userData.username}'s account page`}
        >
            <div className="flex items-center gap-3">
                {/* User Avatar - consistent with Account component */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-${bgAccent} border border-${borderAccent} flex items-center justify-center ${isPremium ? 'shadow-lg shadow-amber-500/20' : ''}`}>
                    <span className={`text-${textAccent} text-lg font-semibold`}>
                        {userData.username.charAt(0).toUpperCase()}
                    </span>
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm truncate flex items-center gap-2">
                        {userData.username}
                        {isPremium && <Crown className="w-3 h-3 text-amber-400" />}
                    </div>
                    <div className="text-zinc-400 text-xs truncate">
                        {userData.email}
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex-shrink-0 p-2 transition-colors duration-200 text-zinc-400 hover:text-red-400"
                    aria-label="Logout"
                    title="Logout"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default UserProfile;