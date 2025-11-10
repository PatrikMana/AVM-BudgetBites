// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

const ProtectedRoute = ({ children }) => {
    const username = Cookies.get("username");
    
    if (!username) {
        // Redirect to login with message if not authenticated
        return <Navigate to="/login?redirect=protected" replace />;
    }
    
    return children;
};

export default ProtectedRoute;
