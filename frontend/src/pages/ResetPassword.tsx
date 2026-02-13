import * as React from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import { UtensilsCrossed, CheckCircle, Eye, EyeOff, KeyRound } from "lucide-react";

const ResetPassword = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // View state: 'form' | 'success' | 'error'
  const [view, setView] = useState<'form' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState("");

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setView('error');
      setErrorMessage("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  // Reset password handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorText = errorData?.message || await response.text();
        throw new Error(errorText || "Failed to reset password");
      }

      setView('success');

      toast({
        title: "Password reset successful!",
        description: "You can now log in with your new password.",
      });
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "Please try again or request a new reset link.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-screen min-h-dvh grid place-items-center p-6 bg-zinc-950">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur">
          {/* Header */}
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/30">
              {view === 'success' ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <KeyRound className="h-6 w-6" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Budget Bites
              </h2>
              <p className="text-sm text-zinc-400">
                {view === 'form' && "Create a new password"}
                {view === 'success' && "Password updated!"}
                {view === 'error' && "Something went wrong"}
              </p>
            </div>
          </div>

          {/* Form View */}
          {view === 'form' && (
            <>
              {/* Description text */}
              <p className="mb-8 text-center text-base text-zinc-300 leading-relaxed">
                Enter your new password below.<br />
                Make sure it's at least 8 characters.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-zinc-300">New Password</div>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 pr-12 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                      style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <div className="mb-1 text-sm font-medium text-zinc-300">Confirm New Password</div>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2 pr-12 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                      style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </label>

                {/* Spacer */}
                <div className="h-[16px]"></div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {/* Success View */}
          {view === 'success' && (
            <div className="space-y-6 text-center animate-slide-up py-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  Password has been changed!
                </h3>
                <p className="text-zinc-400">
                  You can now log in with your new password.
                </p>
              </div>
              <button
                onClick={() => window.location.href = "/login"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
              >
                Go to Login
              </button>
            </div>
          )}

          {/* Error View */}
          {view === 'error' && (
            <div className="space-y-6 text-center animate-slide-up py-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  Invalid Reset Link
                </h3>
                <p className="text-zinc-400">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => window.location.href = "/login"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;

