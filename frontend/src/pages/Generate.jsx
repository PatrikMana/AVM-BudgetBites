import CocktailGeneratorPanel, { EXAMPLE_COCKTAIL } from "../components/CocktailGeneratorPanel.jsx";
import { useOutletContext } from "react-router-dom";

export default function Generate() {
    const { menuOpen, panelWidth } = useOutletContext() || { menuOpen: false, panelWidth: 0 };

    const handleGenerate = (filters) => {
        console.log("Generate cocktails with:", filters);

        // For testing — log the example Margarita result
        console.log("Example cocktail result:", EXAMPLE_COCKTAIL);
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
                <CocktailGeneratorPanel onGenerate={handleGenerate} />
            </div>
        </main>
    );
}
