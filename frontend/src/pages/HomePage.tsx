import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Reveal stages: 0 = hidden, 1 = tagline, 2 = title, 3 = description, 4 = button
  const [stage, setStage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Staggered sequence timeline (3.2s window)
  useEffect(() => {
    if (loading || isAuthenticated) return;

    const t1 = setTimeout(() => setStage(1), 300); // Tagline
    const t2 = setTimeout(() => setStage(2), 1200); // Title
    const t3 = setTimeout(() => setStage(3), 2200); // Description
    const t4 = setTimeout(() => setStage(4), 3200); // Button appears

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [loading, isAuthenticated]);

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleBegin = () => {
    setIsTransitioning(true);

    // Smooth exit transition without lag
    setTimeout(() => {
      navigate("/login");
    }, 700);
  };

  return (
    <div className="min-h-screen bg-midnight text-white flex flex-col items-center justify-center p-4 selection:bg-neon-lime selection:text-midnight overflow-hidden relative font-sans">
      {/* Light Ambient Glow (Hardware Accelerated) */}
      <div
        className={`absolute w-[450px] h-[450px] bg-neon-lime/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-1000 ease-out will-change-[opacity] ${
          isTransitioning ? "opacity-40" : "opacity-20"
        }`}
      />

      {/* Hero Content Container */}
      <div
        className={`text-center max-w-xl mx-auto flex flex-col items-center gap-6 z-10 transition-all duration-700 ease-in-out will-change-[opacity,transform] ${
          isTransitioning
            ? "opacity-0 -translate-y-4 pointer-events-none"
            : "opacity-100 translate-y-0"
        }`}
      >
        {/* LINE 1: Tagline */}
        <div
          className={`transition-all duration-700 ease-out ${
            stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <span className="font-merkur text-neon-lime text-2xl tracking-widest uppercase block drop-shadow-[0_0_8px_rgba(188,255,60,0.4)]">
            BUILD • LEARN • GROW
          </span>
        </div>

        {/* LINE 2: Title */}
        <div
          className={`transition-all duration-700 ease-out ${
            stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <h1 className="font-neovision text-5xl md:text-6xl text-white tracking-wider leading-tight">
            WELCOME TO <br />
            <span className="text-neon-lime drop-shadow-[0_0_20px_rgba(188,255,60,0.3)]">
              NEXUSSPACE
            </span>
          </h1>
        </div>

        {/* LINE 3: Description */}
        <div
          className={`transition-all duration-700 ease-out ${
            stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <p className="text-gray-400 text-sm md:text-base max-w-md leading-relaxed">
            Your next-generation interactive learning environment and workspace.
            Connect, innovate, and master your technical skills.
          </p>
        </div>

        {/* LINE 4: Interactive Button */}
        <div
          className={`transition-all duration-700 ease-out mt-2 ${
            stage >= 4
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <button
            onClick={handleBegin}
            disabled={isTransitioning}
            className={`font-neovision font-bold text-lg px-10 py-4 rounded-full transition-all duration-300 cursor-pointer uppercase tracking-wider relative overflow-hidden ${
              isTransitioning
                ? "bg-neon-lime text-midnight opacity-90"
                : "bg-neon-lime text-midnight shadow-[0_0_25px_rgba(188,255,60,0.35)] hover:shadow-[0_0_40px_rgba(188,255,60,0.6)] hover:scale-105"
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isTransitioning ? "INITIALIZING NEXUS..." : "Continue to Begin"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
