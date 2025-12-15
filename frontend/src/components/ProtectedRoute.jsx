// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../lib/auth";

const ProtectedRoute = ({ children }) => {
    // Use the centralized auth utility to check authentication
    const authenticated = isAuthenticated();
    
    if (!authenticated) {
        // Redirect to login with message if not authenticated
        return <Navigate to="/login?redirect=protected" replace />;
    }
    
    return children;
};

export default ProtectedRoute;
