"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#131313' }}>
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        await signUp(email, password);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Google sign-in failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen text-on-surface font-body" style={{ backgroundColor: '#131313' }}>
      <div className="auth-card rounded-xl p-12 shadow-2xl relative overflow-hidden" style={{ 
        backgroundColor: '#1b1b1c',
        border: '1px solid #2a2a2a',
        width: '440px'
      }}>
        {/* Brand Identity Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 flex items-center justify-center bg-surface-container-high rounded-lg p-3">
            <span className="material-symbols-outlined text-primary text-4xl" data-icon="memory">memory</span>
          </div>
          <h1 className="font-bold text-2xl tracking-tight text-[#F0F0F0]">Remote MCU</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Synthetic Workshop v2.4.0</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-surface-container-highest mb-8">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${isLogin ? 'border-primary text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          >
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${!isLogin ? 'border-primary text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          >
            Register
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-container text-error text-sm">
            {error}
          </div>
        )}

        {/* Login/Register Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant mb-2 block">Hardware ID / Email</label>
            <input 
              className="w-full h-11 bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-4 text-sm text-on-surface placeholder:text-surface-container-highest transition-all"
              placeholder="engineer@mcu-remote.io" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant block">Access Key</label>
              {isLogin && (
                <a className="text-[11px] font-medium text-primary hover:underline transition-all" href="#">Forgot password?</a>
              )}
            </div>
            <div className="relative">
              <input 
                className="w-full h-11 bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-4 text-sm text-on-surface placeholder:text-surface-container-highest transition-all"
                placeholder="••••••••••••" 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]" data-icon={showPassword ? "visibility_off" : "visibility"}>
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant mb-2 block">Confirm Access Key</label>
              <input 
                className="w-full h-11 bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-4 text-sm text-on-surface placeholder:text-surface-container-highest transition-all"
                placeholder="••••••••••••" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {/* Primary Action */}
          <button 
            type="submit"
            className="w-full h-12 text-on-primary-container font-bold text-base rounded-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{ 
              background: 'linear-gradient(135deg, #67d7dd 0%, #1da0a6 100%)'
            }}
            disabled={loading}
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="login">login</span>
            {loading ? "Please wait..." : isLogin ? "Initialize Session" : "Create Account"}
          </button>

          {/* Divider */}
          <div className="relative py-4 flex items-center">
            <div className="flex-grow border-t border-surface-container-highest"></div>
            <span className="flex-shrink mx-4 font-mono text-[10px] uppercase tracking-tighter text-on-surface-variant">or continue with</span>
            <div className="flex-grow border-t border-surface-container-highest"></div>
          </div>

          {/* OAuth Option */}
          <button 
            type="button"
            className="w-full h-11 bg-surface-container-high border border-outline-variant/20 hover:bg-surface-bright text-on-surface font-medium text-sm rounded-lg flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Continue with Google
          </button>
        </form>

        {/* Footer / Support Link */}
        <div className="mt-8 text-center">
          <p className="font-mono text-[10px] text-on-surface-variant">
            Encountering issues? 
            <Link className="text-primary hover:underline ml-1" href="/support">Contact Systems Engineering</Link>
          </p>
        </div>

        {/* Decorative UI Element */}
        <div className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none select-none">
          <span className="material-symbols-outlined text-[120px]" data-icon="terminal">terminal</span>
        </div>
      </div>
    </div>
  );
}
