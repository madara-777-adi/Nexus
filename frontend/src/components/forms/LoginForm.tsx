import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Pass credentials directly to AuthContext login
      await login(formData);

      // 2. Navigate straight to Dashboard upon success
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <h1 className="font-neovision text-3xl text-white tracking-wider mb-2">
        SIGN IN
      </h1>

      {errorMessage && (
        <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-3 rounded-xl text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 font-medium">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="name@example.com"
          className="bg-surface-border/30 border border-surface-border text-white text-sm rounded-xl p-3 focus:outline-none focus:border-neon-lime transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 font-medium">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="••••••••"
          className="bg-surface-border/30 border border-surface-border text-white text-sm rounded-xl p-3 focus:outline-none focus:border-neon-lime transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 bg-neon-lime text-midnight font-neovision font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer uppercase tracking-wider disabled:opacity-50"
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}