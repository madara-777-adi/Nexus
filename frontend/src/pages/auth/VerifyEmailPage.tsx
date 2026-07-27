import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Guard flag to prevent double execution in React Strict Mode
  const hasExecuted = useRef(false);

  // Extract token from query params (?token=XYZ or raw ?XYZ)
  const rawQuery = location.search.replace("?", "");
  const token =
    searchParams.get("token") ||
    (rawQuery && !rawQuery.includes("=") ? rawQuery : null);

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token in request.");
      return;
    }

    // Prevent duplicate API calls in React Strict Mode
    if (hasExecuted.current) return;
    hasExecuted.current = true;

    const verifyToken = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(res.data.message || "Email verified successfully!");
      } catch (err: any) {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Verification failed or token expired.",
        );
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-midnight text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-surface border border-surface-border p-8 rounded-3xl max-w-md w-full text-center flex flex-col items-center gap-5 shadow-2xl">
        <span className="font-merkur text-neon-lime text-xl block">
          Nexus Verification
        </span>
        <h1 className="font-neovision text-3xl text-white tracking-wider">
          EMAIL VERIFICATION
        </h1>

        {status === "loading" && (
          <p className="text-gray-400 text-sm animate-pulse">
            Verifying your security token with backend...
          </p>
        )}

        {status === "success" && (
          <div className="flex flex-col gap-4 w-full">
            <div className="bg-neon-lime/20 text-neon-lime border border-neon-lime/30 p-3 rounded-xl text-xs font-semibold">
              {message}
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-neon-lime text-midnight font-neovision font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer uppercase tracking-wider"
            >
              Proceed to Sign In
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col gap-4 w-full">
            <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-3 rounded-xl text-xs font-semibold">
              {message}
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full border border-surface-border text-gray-300 font-neovision py-3.5 rounded-xl hover:bg-surface-border/50 transition-all cursor-pointer uppercase tracking-wider"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
