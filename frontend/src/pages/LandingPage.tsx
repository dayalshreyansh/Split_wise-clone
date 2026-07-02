import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Wallet,
  Users,
  Receipt,
  ShieldCheck,
  Bell,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* NAVBAR */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-emerald-600">Split</span>WiseClone
          </h1>

          <div className="flex gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 font-semibold text-slate-700 hover:text-slate-900"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/register")}
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-slate-50 to-blue-100" />

        <div className="relative max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-4 py-2 font-semibold mb-8">
              <CheckCircle2 size={18} />
              Simplify Shared Expenses
            </span>

            <h1 className="text-7xl font-black leading-tight tracking-tight">
              Split expenses.
              <br />
              <span className="text-emerald-600">
                Not friendships.
              </span>
            </h1>

            <p className="text-xl text-slate-600 mt-8 max-w-3xl leading-relaxed">
              Keep track of group expenses, settle balances instantly,
              and make managing shared finances effortless.
              Perfect for roommates, trips, teams, and friends.
            </p>

            <div className="flex gap-5 mt-12">
              <button
                onClick={() => navigate("/register")}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-black transition flex items-center gap-3"
              >
                Start For Free
                <ArrowRight size={20} />
              </button>

              <button
                onClick={() => navigate("/login")}
                className="bg-white border border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-100 transition"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="-mt-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-10 grid md:grid-cols-3 gap-10">
            <div>
              <h2 className="text-5xl font-black text-emerald-600">
                ₹10K+
              </h2>
              <p className="text-slate-500 mt-2">
                Expenses managed
              </p>
            </div>

            <div>
              <h2 className="text-5xl font-black text-emerald-600">
                100+
              </h2>
              <p className="text-slate-500 mt-2">
                Groups created
              </p>
            </div>

            <div>
              <h2 className="text-5xl font-black text-emerald-600">
                Real-Time
              </h2>
              <p className="text-slate-500 mt-2">
                Settlement tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-black">
            Everything you need
          </h2>

          <p className="text-slate-500 text-xl mt-5">
            Built for modern groups and shared finances.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Wallet,
              title: "Expense Tracking",
              desc:
                "Track every expense and automatically calculate who owes whom.",
            },
            {
              icon: Users,
              title: "Group Management",
              desc:
                "Invite members, create groups and manage expenses collaboratively.",
            },
            {
              icon: Receipt,
              title: "Receipt Scanning",
              desc:
                "Upload receipts and automatically extract expense information.",
            },
            {
              icon: ShieldCheck,
              title: "Secure",
              desc:
                "JWT authentication and secure financial data handling.",
            },
            {
              icon: Bell,
              title: "Real-Time Updates",
              desc:
                "Receive instant notifications and live balance updates.",
            },
            {
              icon: CheckCircle2,
              title: "Smart Settlements",
              desc:
                "Minimize transactions with optimized settlement algorithms.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-100 p-10 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-8">
                <f.icon size={32} />
              </div>

              <h3 className="text-2xl font-bold mb-4">
                {f.title}
              </h3>

              <p className="text-slate-500 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white border-y border-slate-100 py-28">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-black text-center mb-20">
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              "Create a group and invite your friends.",
              "Add expenses and split them automatically.",
              "Settle balances with one click.",
            ].map((step, i) => (
              <div
                key={i}
                className="bg-slate-50 rounded-3xl p-10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-600 text-white text-2xl font-black flex items-center justify-center mx-auto mb-8">
                  {i + 1}
                </div>

                <p className="text-xl font-semibold">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[40px] p-16 text-center text-white">
            <h2 className="text-5xl font-black mb-6">
              Ready to simplify expenses?
            </h2>

            <p className="text-slate-300 text-xl mb-10">
              Join today and never argue about money again.
            </p>

            <button
              onClick={() => navigate("/register")}
              className="bg-emerald-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <p className="text-slate-500">
            © 2026 SplitWiseClone. All rights reserved.
          </p>

          <p className="text-slate-400">
            Built with React • Node • Prisma • PostgreSQL
          </p>
        </div>
      </footer>
    </div>
  );
}