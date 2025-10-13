import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
// @ts-ignore
import heroImage from "../assets/react.svg";
import * as React from "react";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            toast({
                title: "Welcome back!",
                description: "You've successfully logged in.",
            });
            setLoading(false);
        }, 1000);
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
