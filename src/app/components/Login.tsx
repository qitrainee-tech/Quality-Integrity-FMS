import React, { useState } from "react";
import { motion } from "motion/react";
import logo from "../../assets/logo.png";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Activity,
  Stethoscope,
} from "lucide-react";



interface LoginProps {
  onLogin: (userData: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Pass user data to parent component
        onLogin(data.user);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Unable to connect to server. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Left Side - Image Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-green-800">
        <div className="absolute inset-0 bg-gradient-to-br from-green-800/80 to-green-900/90 z-10" />
        <img
          src="https://images.unsplash.com/photo-1643909070454-bbeb9236bc42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3NwaXRhbCUyMGJ1aWxkaW5nJTIwZXh0ZXJpb3IlMjBncmVlbiUyMG5hdHVyZXxlbnwxfHx8fDE3Njk1ODQzMTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="PJG Hospital Building"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="relative z-20 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="">
                {/* <Activity className="w-6 h-6 text-white" /> */}
                <img src={logo} alt="PJG Hospital" className="w-24 h-24 object-cover" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Quality Improvement - IPCPSU
              </h1>
              
            </div>
              
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Quality Care, <br />
              <span className="text-green-300">
                Quality Service.
              </span>
            </h2>
            <p className="text-lg text-green-50/80 max-w-md leading-relaxed">
              Welcome to the Quality Improvement department's
              File Management System
            </p>

            <div className="mt-12 flex items-center gap-4 text-sm text-green-200/60">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-green-700 border-2 border-green-800 flex items-center justify-center"
                  >
                    <Stethoscope className="w-4 h-4 text-white/50" />
                  </div>
                ))}
              </div>
              <p>Sa Bagong Paulino, May Puso ang Serbisyo!</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-green-50 text-green-600 mb-6 lg:hidden">
                <img src={logo} alt="PJG Hospital Logo" className="w-20 h-20" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome Back
              </h2>
              <p className="mt-2 text-gray-500">
                Please enter your details to sign in
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none bg-gray-50/50 hover:bg-white"
                    placeholder="doctor@pjghospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-medium text-gray-700"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-sm font-medium text-green-600 hover:text-green-700"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none bg-gray-50/50 hover:bg-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-600/20 hover:shadow-green-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500">
                Don't have an account?{" "}
                <a
                  href="#"
                  className="font-semibold text-green-600 hover:text-green-700"
                >
                  Contact IT Support
                </a>
              </p>
            </div>

            <div className="mt-12 pt-6 border-t border-gray-100">
              <p className="text-xs text-center text-gray-400">
                &copy; {new Date().getFullYear()} PJG Hospital.
                System restricted to authorized personnel.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}