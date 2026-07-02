import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await authService.login({
        email,
        password,
      });

      localStorage.setItem("token", data.token);
      setUser(data.user);
      navigate("/");
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 flex items-center justify-center px-4">
      {/* Background Blobs */}
      <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-teal-300/30 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
              <span className="text-3xl text-white font-bold">₹</span>
            </div>

            <h1 className="mt-5 text-3xl font-bold text-slate-800">
              Welcome Back
            </h1>

            <p className="mt-2 text-center text-slate-500">
              Sign in to continue managing expenses with friends.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Email
              </label>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-xl border border-slate-200
                  bg-slate-50 px-4 py-3 text-slate-700
                  placeholder:text-slate-400
                  focus:border-emerald-500
                  focus:outline-none
                  focus:ring-2 focus:ring-emerald-500/20
                  transition-all
                "
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Password
              </label>

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full rounded-xl border border-slate-200
                  bg-slate-50 px-4 py-3 text-slate-700
                  placeholder:text-slate-400
                  focus:border-emerald-500
                  focus:outline-none
                  focus:ring-2 focus:ring-emerald-500/20
                  transition-all
                "
              />
            </div>

            <button
              type="submit"
              className="
                w-full rounded-xl bg-emerald-500 py-3
                font-semibold text-white shadow-lg
                shadow-emerald-500/25
                transition-all duration-200
                hover:-translate-y-0.5
                hover:bg-emerald-600
                active:translate-y-0
              "
            >
              Sign In
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}