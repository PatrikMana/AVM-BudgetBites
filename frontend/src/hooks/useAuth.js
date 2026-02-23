// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { 
  isAuthenticated, 
  getUserData, 
  getTokenPayload,
  login as authLogin,
  logout as authLogout 
} from '../lib/auth';

/**
 * Custom hook for authentication state management
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status
  const checkAuth = () => {
    const isAuth = isAuthenticated();
    const userData = getUserData();
    
    setAuthenticated(isAuth);
    setUser(isAuth ? userData : null);
    setLoading(false);
  };

  // Effect to check auth on mount and periodically
  useEffect(() => {
    checkAuth();

    // Check every 5 seconds for token changes/expiry
    const interval = setInterval(checkAuth, 5000);

    return () => clearInterval(interval);
  }, []);

  // Login method
  const login = async (username, password, email) => {
    setLoading(true);
    try {
      const result = await authLogin(username, password, email);
      checkAuth(); // Refresh state
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Logout method
  const logout = (redirect = true) => {
    authLogout(redirect);
    setAuthenticated(false);
    setUser(null);
  };

  // Get current user data
  const getCurrentUser = () => {
    return getUserData();
  };

  // Get token payload (for debugging)
  const getTokenData = () => {
    return getTokenPayload();
  };

  return {
    authenticated,
    user,
    loading,
    login,
    logout,
    checkAuth,
    getCurrentUser,
    getTokenData,
  };
};

export default useAuth;