import * as React from "react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import Cookies from "js-cookie";
// @ts-ignore
import heroImage from "../assets/react.svg";
import { UtensilsCrossed, CheckCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

const Login = () => {
  const { toast } = useToast();

  // View state: 'auth' | 'verify' | 'success' bsahdbus
  const [view, setView] = useState<'auth' | 'verify' | 'success'>('auth');
  const [successMessage, setSuccessMessage] = useState("");

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

  // Check if user already has a token
  const token = Cookies.get("auth_token");
  if (token) {
    console.log("User is logged in:", token);
  }

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call the correct backend endpoint
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: loginUsername, 
          password: loginPassword 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Invalid credentials");
      }

      // Backend currently returns plain text, so handle that
      const successMessage = await response.text();
      console.log("Login response:", successMessage);

      // For now, create a mock token since backend doesn't return JWT yet
      // TODO: Remove this when backend implements JWT
      const mockToken = btoa(`${loginUsername}:${Date.now()}`);
      Cookies.set("auth_token", mockToken, {
        expires: 1,
        secure: false,
        sameSite: "Strict",
      });

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });

      setTimeout(() => {
        window.location.href = "/";
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
      const loginResponse = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: signupUsername, 
          password: signupPassword 
        }),
      });

      if (loginResponse.ok) {
        const mockToken = btoa(`${signupUsername}:${Date.now()}`);
        Cookies.set("auth_token", mockToken, {
          expires: 1,
          secure: false,
          sameSite: "Strict",
        });

        setSuccessMessage("Registration successful! You are now logged in.");
        setView('success');
      } else {
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
    Cookies.remove("auth_token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* ...existing background effects... */}

      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl animate-fade-in">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
            {view === 'success' ? (
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            ) : (
              <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Budget Bites
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {view === 'auth' && "Delicious meals that fit your budget"}
              {view === 'verify' && "Please verify your email"}
              {view === 'success' && "Welcome!"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'auth' && (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="animate-slide-up">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="your_username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="bg-muted/50 border-border"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90 transition-all shadow-glow"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup" className="animate-slide-up">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="choose_username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    required
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                    className="bg-muted/50 border-border"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90 transition-all shadow-glow"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          )}

          {view === 'verify' && (
            <div className="space-y-4 animate-slide-up">
              <form onSubmit={handleVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    maxLength={6}
                    className="bg-muted/50 border-border text-center text-2xl tracking-widest"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    Check your email: {emailToVerify}
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90 transition-all shadow-glow"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify Email"}
                </Button>
              </form>
            </div>
          )}

          {view === 'success' && (
            <div className="space-y-6 text-center animate-slide-up py-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  {successMessage}
                </h3>
                <p className="text-muted-foreground">
                  You can now access all features of Budget Bites!
                </p>
              </div>
              <Button
                onClick={() => window.location.href = "/"}
                className="w-full bg-gradient-primary hover:opacity-90 transition-all shadow-glow"
              >
                Back to Home Page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;