// src/lib/auth.js
import Cookies from "js-cookie";

/**
 * Auth utility functions for JWT token management
 */

// Token storage key
const TOKEN_KEY = "auth_token";
const USER_KEY = "username";
const EMAIL_KEY = "email";

/**
 * Store JWT token and user data in cookies
 * @param {string} token - JWT token from backend
 * @param {Object} userData - User data object
 * @param {string} userData.username - Username
 * @param {string} userData.email - Email
 */
export const setAuthToken = (token, userData = {}) => {
  // Store JWT token
  Cookies.set(TOKEN_KEY, token, {
    expires: 7, // 7 days
    secure: false, // Set to true in production with HTTPS
    sameSite: "Strict",
  });

  // Store user data if provided
  if (userData.username) {
    Cookies.set(USER_KEY, userData.username, {
      expires: 7,
      secure: false,
      sameSite: "Strict",
    });
  }

  if (userData.email) {
    Cookies.set(EMAIL_KEY, userData.email, {
      expires: 7,
      secure: false,
      sameSite: "Strict",
    });
  }
};

/**
 * Get stored JWT token
 * @returns {string|null} JWT token or null if not found
 */
export const getAuthToken = () => {
  return Cookies.get(TOKEN_KEY) || null;
};

/**
 * Get stored user data
 * @returns {Object} User data object
 */
export const getUserData = () => {
  return {
    username: Cookies.get(USER_KEY) || null,
    email: Cookies.get(EMAIL_KEY) || null,
    token: getAuthToken(),
  };
};

/**
 * Clear all auth data (logout)
 */
export const clearAuthData = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_KEY);
  Cookies.remove(EMAIL_KEY);
  // Clear any other auth-related cookies
  Cookies.remove("plan");
};

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  
  if (!token) {
    return false;
  }

  // Basic token format validation (JWT has 3 parts separated by dots)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    console.warn("Invalid JWT token format");
    clearAuthData(); // Clear invalid token
    return false;
  }

  try {
    // Check if token is expired (basic check of payload)
    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < currentTime) {
      console.warn("JWT token expired");
      clearAuthData(); // Clear expired token
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Failed to parse JWT token:", error);
    clearAuthData(); // Clear invalid token
    return false;
  }
};

/**
 * Get decoded JWT payload (without verification - only for client-side data)
 * @returns {Object|null} Decoded payload or null if invalid
 */
export const getTokenPayload = () => {
  const token = getAuthToken();
  
  if (!token) {
    return null;
  }

  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }

    return JSON.parse(atob(tokenParts[1]));
  } catch (error) {
    console.warn("Failed to decode JWT payload:", error);
    return null;
  }
};

/**
 * Create Authorization header for API requests
 * @returns {Object} Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  
  if (!token) {
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Enhanced fetch wrapper that automatically includes auth headers
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch response
 */
export const authFetch = async (url, options = {}) => {
  const authHeaders = getAuthHeaders();
  
  const config = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // If we get 401 Unauthorized, token is likely invalid
    if (response.status === 401) {
      console.warn("Received 401, clearing auth data");
      clearAuthData();
      // Optionally redirect to login
      window.location.href = '/login?redirect=unauthorized';
    }

    return response;
  } catch (error) {
    console.error("AuthFetch error:", error);
    throw error;
  }
};

/**
 * Login function that handles JWT response from backend
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Success response with user data
 */
export const login = async (username, password) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Login failed');
  }

  // Try to parse as JSON first (for JWT response)
  const responseText = await response.text();
  let responseData;

  try {
    responseData = JSON.parse(responseText);
  } catch {
    // If not JSON, treat as plain text (fallback for current backend)
    responseData = { message: responseText };
  }

  // If backend returns JWT token in response
  if (responseData.token) {
    // Extract user data from token payload or response
    const userData = {
      username: responseData.username || username,
      email: responseData.email || `${username}@budgetbites.com`, // fallback
    };

    setAuthToken(responseData.token, userData);

    return {
      success: true,
      token: responseData.token,
      user: userData,
    };
  } else {
    // Fallback for current backend that doesn't return JWT yet
    const mockToken = btoa(`${username}:${Date.now()}:mock`);
    const userData = {
      username,
      email: `${username}@budgetbites.com`,
    };

    setAuthToken(mockToken, userData);

    return {
      success: true,
      token: mockToken,
      user: userData,
      message: responseData.message,
    };
  }
};

/**
 * Logout function
 * @param {boolean} redirectToLogin - Whether to redirect to login page
 */
export const logout = (redirectToLogin = true) => {
  clearAuthData();
  
  if (redirectToLogin) {
    window.location.href = '/login';
  }
};