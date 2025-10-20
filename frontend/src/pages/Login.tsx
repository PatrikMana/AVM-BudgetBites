import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
// @ts-ignore
import heroImage from "../assets/react.svg";
import * as React from "react";
import Cookies from "js-cookie";


const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const token = Cookies.get("auth_token");
    if (token) {
        console.log("User is logged in:", token);
    }

    const handleLogin = async (e: React.FormEvent) => {
        if (!/\S+@\S+\.\S+/.test(email)) {
            toast({
                title: "Invalid email",
                description: "Please enter a valid email address.",
                variant: "destructive",
            });
            return;
        }

        e.preventDefault();
        setLoading(true);

        try {
            // Example POST request (adjust URL to your backend)
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Invalid credentials");
            }

            const data = await response.json();

            // Save token in cookies (1-day expiry)
            Cookies.set("auth_token", data.token, {
                expires: 1,          // days
                secure: true,        // HTTPS only
                sameSite: "Strict",  // prevent CSRF
            });

            toast({
                title: "Welcome back!",
                description: "You've successfully logged in.",
            });

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 800);

        } catch (error: any) {
            toast({
                title: "Login failed",
                description: error.message || "Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };
    const handleLogout = () => {
        Cookies.remove("auth_token");
        window.location.href = "/login";
    };



    return (
        <div className="min-h-screen flex items-center justify-center p-4 gradient-dark">
            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
                {/* Hero Image */}
                <div className="hidden md:block animate-fade-in">
                    <img
                        src={heroImage}
                        alt="Budget Bites - Fresh and affordable food"
                        className="rounded-2xl shadow-2xl glow-primary"
                    />
                    <div className="mt-6 text-center">
                        <h1 className="text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Budget Bites
              </span>
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Eat healthy, spend smart
                        </p>
                    </div>
                </div>

                {/* Login Form */}
                <div className="w-full max-w-md mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
                    <Card className="border-border shadow-xl glow-primary">
                        <CardHeader>
                            <CardTitle className="text-2xl">Welcome back</CardTitle>
                            <CardDescription>Enter your credentials to access your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">Email</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="transition-all focus:glow-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">Password</Label>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="transition-all focus:glow-primary"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full text-base font-semibold transition-all hover:scale-105 hover:glow-primary"
                                    disabled={loading}
                                >
                                    {loading ? "Logging in..." : "Log in"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Login;
