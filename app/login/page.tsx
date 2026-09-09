"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle
} from "lucide-react";
import RealEstateLoader from "@/components/RealEstateLoader";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loaderStatus, setLoaderStatus] = useState("Locating property profile...");
  const [shake, setShake] = useState(false);

  const router = useRouter();

  // Cycle status messages while loading for realistic proptech telemetry
  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;

    if (isLoading && !isSuccess) {
      setLoaderStatus("Scanning Sylvia property directory...");
      
      timer1 = setTimeout(() => {
        setLoaderStatus("Validating resident & unit credentials...");
      }, 700);

      timer2 = setTimeout(() => {
        setLoaderStatus("Turning master key in Sylvia portal...");
      }, 1400);

      timer3 = setTimeout(() => {
        setLoaderStatus("Establishing secure property session...");
      }, 2100);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isLoading, isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setIsSuccess(false);
    setUserRole(null);

    const startTime = Date.now();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      // Ensure minimum animation playtime (~1200ms) so user experiences the full-screen real estate animation
      const elapsed = Date.now() - startTime;
      const minPlayTime = 1200;
      if (elapsed < minPlayTime) {
        await new Promise((resolve) => setTimeout(resolve, minPlayTime - elapsed));
      }

      if (res.ok) {
        setIsSuccess(true);
        setUserRole(data.role);
        setLoaderStatus(
          `Access Granted! Welcome to ${
            data.role === "super_admin" 
              ? "Super Admin Portal" 
              : data.role === "admin" 
              ? "Property Management" 
              : "Resident Portal"
          }`
        );

        // Brief delay to let the user enjoy the unlocked door & success check
        setTimeout(() => {
          if (data.role === "super_admin") router.push("/super-admin");
          else if (data.role === "admin") router.push("/admin");
          else router.push("/tenant");
        }, 900);
      } else {
        setIsLoading(false);
        setError(data.error || "Invalid email or password. Please verify your credentials.");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setIsLoading(false);
      setError("An unexpected network error occurred. Please check your connection and try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <>
      {/* Full-Screen Real Estate Loading Overlay */}
      {isLoading && (
        <RealEstateLoader 
          statusText={loaderStatus} 
          isSuccess={isSuccess} 
          role={userRole} 
        />
      )}

      {/* Main Login Screen */}
      <div className="min-h-screen relative flex items-center justify-center bg-slate-950 p-4 sm:p-6 overflow-hidden select-none">
        
        {/* Architectural Blueprint / Grid Backdrop */}
        <div 
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #38bdf8 1px, transparent 1px),
              linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Ambient Lighting Orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Main Form Card */}
        <div 
          className={`relative z-10 max-w-md w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-950/40 border border-slate-200/80 p-6 sm:p-8 transition-all duration-300 ${
            shake ? "animate-card-shake" : ""
          }`}
        >
          {/* Brand Header */}
          <div className="text-center mb-6">
            {/* Sylvia Geometric Architectural Logo */}
            <div className="inline-flex items-center justify-center mb-3 group">
              <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 ring-4 ring-blue-100/60 transition-transform duration-300 group-hover:scale-105">
                <Building2 className="h-7 w-7 text-white stroke-[2.2]" />
                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                  <KeyRound className="h-3 w-3 text-slate-900" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Sylvia
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                PropTech
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Intelligent Property & Tenant Management
            </p>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="bg-red-50/90 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm mb-5 flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-800">Authentication Failed</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@property.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Enhanced Sign In Button */}
            <button
              type="submit"
              className="w-full mt-2 relative group overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
                  animation: "shimmerGlow 2s infinite",
                }}
              />
              
              <span className="relative flex items-center gap-2 text-sm">
                Sign In to Sylvia
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 pt-4 text-center border-t border-slate-100/80">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Sylvia Real Estate Enterprise Platform • v2.4
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
