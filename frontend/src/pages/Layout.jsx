// src/pages/Layout.jsx
import { Outlet } from "react-router-dom";
import StaggeredMenu from "../components/StaggeredMenu.jsx";
import cookingLogo from "../assets/Cooking.png";
import { useState, useCallback, useEffect } from "react";
import Cookies from "js-cookie";

const socialItems = [
    { label: "Twitter", link: "https://twitter.com" },
    { label: "GitHub", link: "https://github.com" },
    { label: "LinkedIn", link: "https://linkedin.com" },
];

export default function Layout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [panelWidth, setPanelWidth] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check login status and poll for changes
    useEffect(() => {
        const checkLoginStatus = () => {
            const username = Cookies.get("username");
            setIsLoggedIn(!!username);
        };

        // Check immediately
        checkLoginStatus();

        // Check every 500ms for cookie changes (login/logout)
        const interval = setInterval(checkLoginStatus, 500);

        return () => clearInterval(interval);
    }, []);

    // Dynamic menu items based on login status
    const menuItems = isLoggedIn 
        ? [
            { label: "Home", ariaLabel: "Go to home page", link: "/" },
            { label: "Generate", ariaLabel: "Generate meal plans", link: "/generate" },
            { label: "Account", ariaLabel: "View your account", link: "/account" },
          ]
        : [
            { label: "Home", ariaLabel: "Go to home page", link: "/" },
            { label: "Generate", ariaLabel: "Generate meal plans", link: "/generate" },
            { label: "Login", ariaLabel: "Log into page", link: "/login" },
          ];

    const measurePanel = useCallback(() => {
        // StaggeredMenu má <aside id="staggered-menu-panel" ...>
        const el = document.getElementById("staggered-menu-panel");
        if (el) setPanelWidth(el.getBoundingClientRect().width || 0);
    }, []);

    return (
        <>
            {/* FIXED overlay menu – nezabírá žádné místo v layoutu */}
            <StaggeredMenu
                key={isLoggedIn ? 'logged-in' : 'logged-out'}
                isFixed
                position="left"
                items={menuItems}
                socialItems={socialItems}
                displaySocials
                displayItemNumbering
                menuButtonColor="#fff"
                openMenuButtonColor="#fff"
                changeMenuColorOnOpen
                colors={["#10b981", "#059669"]}
                logoUrl={cookingLogo}
                accentColor="#10b981"
                onMenuOpen={() => {
                    setMenuOpen(true);
                    // po otevření změř šířku panelu (pro vizuální vystředění obsahu napravo)
                    requestAnimationFrame(measurePanel);
                }}
                onMenuClose={() => setMenuOpen(false)}
            />

            {/* Hlavní obsah rout – sem vykresluj stránky */}
            <div
                // posíláme do Out letu info pro případné re-centr o vání obsahu (viz Home.jsx níže)
                data-menu-open={menuOpen || undefined}
                style={{ "--menu-shift": `${panelWidth / 2}px` }}
            >
                <Outlet context={{ menuOpen, panelWidth }} />
            </div>
        </>
    );
}