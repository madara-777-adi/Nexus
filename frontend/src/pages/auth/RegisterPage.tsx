import { Sparkles, Check } from "lucide-react";
import { RegisterForm } from "../../components/forms/RegisterForm";

export function RegisterPage() {
  return (
    <div className="min-h-screen bg-midnight text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-x-hidden">
      {/* Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-neon-lime/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan/5 rounded-full blur-[140px]"></div>
      </div>

      {/* Main Split-Screen Auth Card */}
      <div className="relative z-10 w-full max-w-5xl glass-panel rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        {/* Left Value Proposition & Branding Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-surface/90 via-[#1a2030]/80 to-midnight/90 p-6 sm:p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-surface-border">
          <div>
            <div className="flex items-center gap-3 mb-8 sm:mb-10">
              <div className="w-10 h-10 rounded-xl bg-neon-lime flex items-center justify-center text-midnight font-extrabold shadow-[0_0_20px_rgba(188,255,60,0.35)]">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white font-mono">
                Nexus<span className="text-neon-lime">Space</span>
              </span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-4 leading-tight">
              Build your technical mastery path today.
            </h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Create an account to track your multi-tier blueprints,
              personalized curriculum paths, and mastery scores.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                <div className="p-1 rounded-lg bg-neon-lime/10 border border-neon-lime/20 text-neon-lime">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Curated AI learning tracks</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                <div className="p-1 rounded-lg bg-neon-lime/10 border border-neon-lime/20 text-neon-lime">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Session versioning &amp; token security</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                <div className="p-1 rounded-lg bg-neon-lime/10 border border-neon-lime/20 text-neon-lime">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Continuous spaced recall tracking</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-surface-border/60 text-xs text-slate-500 flex items-center justify-between">
            <span>&copy; {new Date().getFullYear()} NexusSpace</span>
            <span className="font-mono text-[10px] text-slate-600">
              AUTH • PROTOTYPE
            </span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-surface/40">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
