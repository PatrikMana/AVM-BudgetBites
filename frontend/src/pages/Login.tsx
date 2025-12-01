import * as React from "react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { useOutletContext } from "react-router-dom";
import Cookies from "js-cookie";
import { login, logout, isAuthenticated, getUserData } from "../lib/auth";
// @ts-ignore
import heroImage from "../assets/react.svg";
import { UtensilsCrossed, CheckCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

/**
 * 🎨 LOGIN PAGE COLOR SYSTEM
 * ==========================
 * 
 * HOW TO CHANGE COLORS:
 * ---------------------
 * 1. For quick changes: Edit the hex values in tailwind.config.js under theme.extend.colors.login
 * 2. The LOGIN_COLORS object below maps semantic names to Tailwind classes
 * 3. Change classes here if you want different Tailwind utilities
 * 
 * COLOR LOCATIONS:
 * ----------------
 * - Global theme colors: /frontend/tailwind.config.js (lines 6-40)
 * - Login specific colors: /frontend/tailwind.config.js (lines 29-40)
 * - This mapping: Below (LOGIN_COLORS object)
 * 
 * EXAMPLE: To change the primary button color from purple to blue:
 * 1. Open tailwind.config.js
 * 2. Find: brand.primary: '#B19EEF'
 * 3. Change to: brand.primary: '#3b82f6' (or any color you want)
 * 
 * All buttons, gradients, and accents will automatically update!
 */
const LOGIN_COLORS = {
  // Page & Card
  pageBackground: 'bg-login-background',         // Main page background (#0a0a0a)
  cardBackground: 'bg-login-cardBg',             // Card background (#1a1a1a)
  cardBorder: 'border-login-cardBorder',         // Card border (#2a2a2a)
  
  // Buttons & Primary Actions
  primaryButton: 'bg-brand-primary',             // Primary button (#B19EEF)
  primaryButtonHover: 'hover:bg-login-primaryHover', // Button hover (#9B7EDF)
  buttonText: 'text-white',                       // Button text color
  
  // Inputs
  inputBackground: 'bg-login-inputBg',           // Input field background (#2a2a2a)
  inputBorder: 'border-login-inputBorder',       // Input field border (#3a3a3a)
  inputFocus: 'focus:ring-brand-primary',        // Input focus ring color
  
  // Text
  primaryText: 'text-login-text',                // Main text color (#ffffff)
  mutedText: '!text-login-textMuted',            // Secondary/muted text (#a0a0a0) - !important to override
  titleGradient: 'bg-gradient-to-r from-brand-primary to-brand-secondary', // Title gradient
  
  // Icon & Logo
  iconBackground: 'bg-gradient-to-br from-brand-primary to-brand-secondary', // Icon container
  iconColor: 'text-white',                        // Icon color
  
  // States
  successColor: 'text-login-success',            // Success state (#10b981)
  errorColor: 'text-login-error',                // Error state (#ef4444)
};

const Login = () => {
  const { toast } = useToast();
  const { menuOpen, panelWidth } = useOutletContext<{ menuOpen: boolean; panelWidth: number }>() || { menuOpen: false, panelWidth: 0 };

  // View state: 'auth' | 'verify' | 'success'
  const [view, setView] = useState<'auth' | 'verify' | 'success'>('auth');
  const [successMessage, setSuccessMessage] = useState("");

  // Show message if redirected from protected route
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('redirect') === 'protected') {
      toast({
        title: "Login Required",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  // Verification state
  const [verificationCode, setVerificationCode] = useState("");
  const [emailToVerify, setEmailToVerify] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // Check if user already has a valid token
  const isLoggedIn = isAuthenticated();
  if (isLoggedIn) {
    const userData = getUserData();
    console.log("User is logged in:", userData);
  }

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use the auth utility for login
      const result = await login(loginUsername, loginPassword);
      
      console.log("Login successful:", result);

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });

      // Redirect after successful login
      setTimeout(() => {
        window.location.href = "/account";
      }, 800);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Signup handler
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please check your password and confirmation.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signupUsername,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 409) {
          throw new Error("This username or email is already registered. Please try logging in or use different credentials.");
        }
        throw new Error(errorText || "Registration failed");
      }

      const message = await response.text();

      // Store email for verification
      setEmailToVerify(signupEmail);
      
      // Switch to verification view
      setView('verify');

      toast({
        title: "Check your email",
        description: "We've sent you a verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verification handler
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToVerify,
          verificationCode: verificationCode,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Verification failed");
      }

      const message = await response.text();

      // Auto-login after verification
      try {
        const loginResult = await login(signupUsername, signupPassword);
        
        setSuccessMessage("Registration successful! You are now logged in.");
        setView('success');
      } catch (loginError) {
        console.warn("Auto-login failed after verification:", loginError);
        setSuccessMessage("Email verified successfully! Please login.");
        setView('success');
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Please check your code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout(true);
  };

  return (
    <main className="w-screen min-h-dvh grid place-items-center p-6 bg-zinc-950">
      <div
        style={{
          transform: menuOpen ? `translateX(${panelWidth / 2}px)` : "none",
          transition: "transform 300ms ease",
          willChange: "transform",
        }}
      >
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur">
          {/* Header */}
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/30">
              {view === 'success' ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <UtensilsCrossed className="h-6 w-6" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Budget Bites
              </h2>
              <p className="text-sm text-zinc-400">
                {view === 'auth' && "Delicious meals that fit your budget"}
                {view === 'verify' && "Please verify your email"}
                {view === 'success' && "Welcome!"}
              </p>
            </div>
          </div>

          {view === 'auth' && (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 gap-2 mb-6 bg-zinc-800/60 border border-white/10 p-1 rounded-lg h-auto">
              <TabsTrigger 
                value="login" 
                className="text-white text-sm py-2 px-4 rounded-md transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="text-white text-sm py-2 px-4 rounded-md transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="animate-slide-up">
              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-zinc-300">Username</div>
                  <input
                    id="login-username"
                    type="text"
                    placeholder="your_username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-zinc-300">Password</div>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup" className="animate-slide-up">
              <form onSubmit={handleSignup} className="space-y-4">
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-zinc-300">Username</div>
                  <input
                    id="signup-username"
                    type="text"
                    placeholder="choose_username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-zinc-300">Email</div>
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-zinc-300">Password</div>
                  <input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-zinc-300">Confirm Password</div>
                  <input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>
              </form>
            </TabsContent>
          </Tabs>
          )}

          {view === 'verify' && (
            <div className="space-y-4 animate-slide-up">
              <form onSubmit={handleVerification} className="space-y-4">
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-zinc-300 text-center">Verification Code</div>
                  <input
                    id="verification-code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    maxLength={6}
                    className="w-full rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500 text-center text-2xl tracking-widest"
                  />
                  <p className="text-sm text-zinc-400 text-center mt-2">
                    Check your email: <span className="text-white">{emailToVerify}</span>
                  </p>
                </label>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Verifying..." : "Verify Email"}
                </button>
              </form>
            </div>
          )}

          {view === 'success' && (
            <div className="space-y-6 text-center animate-slide-up py-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  {successMessage}
                </h3>
                <p className="text-zinc-400">
                  You can now access all features of Budget Bites!
                </p>
              </div>
              <button
                onClick={() => window.location.href = "/account"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
              >
                Go to Account
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </main>
  );
};

export default Login;