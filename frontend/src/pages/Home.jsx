// src/pages/Home.jsx
import RecipeGeneratorPanel from "../components/RecipeGeneratorPanel";
import { useOutletContext } from "react-router-dom";

export default function Home() {
    const { menuOpen, panelWidth } = useOutletContext() || { menuOpen: false, panelWidth: 0 };

    return (
        <p>This is Home</p>
    );
}
