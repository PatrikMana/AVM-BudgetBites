import RecipeGeneratorPanel from "../components/RecipeGeneratorPanel.jsx";
import { useOutletContext } from "react-router-dom";

export default function Generate() {
    const { menuOpen, panelWidth } = useOutletContext() || { menuOpen: false, panelWidth: 0 };

    return (
        <main className="w-screen min-h-dvh grid place-items-center p-6 bg-zinc-950">
            {/* obal, který jemně posuneme doprava, když je otevřené menu vlevo */}
            <div
                style={{
                    transform: menuOpen ? `translateX(${panelWidth / 2}px)` : "none",
                    transition: "transform 300ms ease",
                    willChange: "transform",
                }}
            >
                <RecipeGeneratorPanel onGenerate={(data) => console.log("Generate with:", data)} />
            </div>
        </main>
    );
}