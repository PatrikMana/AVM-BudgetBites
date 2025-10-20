import { Outlet } from "react-router-dom";
import SideBar from "../components/SideBar.js";

export default function Layout() {
    return (
        <div className="flex h-screen">
            <SideBar />

            {/* Nested routes render here */}
            <div className="flex-grow p-8">
                <Outlet />
            </div>
        </div>
    );
}
