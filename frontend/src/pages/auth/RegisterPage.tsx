import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RegisterForm } from "../../components/forms/RegisterForm";

export function RegisterPage() {
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchToLogin = () => {
    setIsSwitching(true);

    // 500ms timing matches the GPU slide duration before route change
    setTimeout(() => {
      navigate("/login");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-midnight text-white flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 relative overflow-x-hidden overflow-y-auto font-sans">
      {/* AUTH CONTAINER CARD
          Mobile/Tablet (< lg): single-column form card only.
          Desktop (>= lg): dual-panel with sliding lime overlay. */}
      <div className="w-full max-w-md lg:max-w-4xl bg-surface border border-surface-border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden lg:min-h-[520px] flex flex-col lg:flex-row relative">
        {/* SLIDING COLOR PANEL OVERLAY — desktop only */}
        <div
          className={`hidden lg:block absolute top-0 left-0 w-1/2 h-full bg-neon-lime rounded-3xl z-20 transition-transform duration-500 ease-in-out will-change-[transform] ${
            isSwitching ? "translate-x-full" : "translate-x-0"
          }`}
        />

        {/* LEFT PANEL: Banner Content — desktop only */}
        <div
          className={`hidden lg:flex w-1/2 p-8 lg:p-12 flex-col items-center justify-center text-center gap-4 text-midnight z-30 transition-all duration-500 ease-in-out will-change-[transform,opacity] ${
            isSwitching
              ? "opacity-0 translate-x-6"
              : "opacity-100 translate-x-0"
          }`}
        >
          <span className="font-merkur text-xl text-midnight/80">
            Already a Member?
          </span>
          <h2 className="font-neovision text-4xl font-bold tracking-wider">
            WELCOME BACK!
          </h2>
          <p className="text-sm text-midnight/80 max-w-xs leading-relaxed">
            Sign in with your credentials to continue your progress in
            NexusSpace.
          </p>
          <button
            onClick={handleSwitchToLogin}
            disabled={isSwitching}
            className="mt-4 border-2 border-midnight text-midnight font-neovision font-bold px-8 py-3 rounded-full hover:bg-midnight hover:text-neon-lime transition-all cursor-pointer uppercase tracking-wider min-h-[44px]"
          >
            Sign In
          </button>
        </div>

        {/* RIGHT PANEL: Register Form Content */}
        <div
          className={`w-full lg:w-1/2 p-5 sm:p-8 lg:p-12 flex flex-col justify-center bg-surface text-white z-10 transition-all duration-500 ease-in-out will-change-[transform,opacity] ${
            isSwitching
              ? "opacity-20 -translate-x-6"
              : "opacity-100 translate-x-0"
          }`}
        >
          <RegisterForm />

          {/* Mobile/Tablet secondary nav — replaces desktop banner CTA */}
          <div className="mt-6 pt-5 border-t border-surface-border lg:hidden text-center">
            <p className="text-xs text-gray-400">
              Already a member?{" "}
              <button
                type="button"
                onClick={handleSwitchToLogin}
                disabled={isSwitching}
                className="text-neon-lime font-semibold hover:underline transition-all cursor-pointer min-h-[44px] inline-flex items-center px-1"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
