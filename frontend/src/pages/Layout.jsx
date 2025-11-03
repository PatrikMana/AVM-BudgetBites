// src/pages/Layout.jsx
import { Outlet } from "react-router-dom";
import StaggeredMenu from "../components/StaggeredMenu.jsx";
import cookingLogo from "../assets/Cooking.png";
import { useState, useCallback } from "react";

const menuItems = [
    { label: "Home", ariaLabel: "Go to home page", link: "/" },
    { label: "About", ariaLabel: "Learn about us", link: "/about" },
    { label: "Login", ariaLabel: "Log into page", link: "/login" },
];

const socialItems = [
    { label: "Twitter", link: "https://twitter.com" },
    { label: "GitHub", link: "https://github.com" },
    { label: "LinkedIn", link: "https://linkedin.com" },
];

export default function Layout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [panelWidth, setPanelWidth] = useState(0);

    const measurePanel = useCallback(() => {
        // StaggeredMenu má <aside id="staggered-menu-panel" ...>
        const el = document.getElementById("staggered-menu-panel");
        if (el) setPanelWidth(el.getBoundingClientRect().width || 0);
    }, []);

    return (
        <>
            {/* FIXED overlay menu – nezabírá žádné místo v layoutu */}
            <StaggeredMenu
                isFixed
                position="left"
                items={menuItems}
                socialItems={socialItems}
                displaySocials
                displayItemNumbering
                menuButtonColor="#fff"
                openMenuButtonColor="#fff"
                changeMenuColorOnOpen
                colors={["#F59E0B", "#16A34A"]}
                logoUrl={cookingLogo}
                accentColor="#ff6b6b"
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