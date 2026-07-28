import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-midnight text-white px-6 text-center">
      <p className="font-neovision text-neon-lime text-lg tracking-wider uppercase">
        404
      </p>
      <h1 className="text-xl font-semibold">This page doesn't exist</h1>
      <p className="max-w-sm text-sm text-gray-400">
        The URL you followed doesn't match any route in NexusSpace. Double-check
        the link, or head back to your dashboard.
      </p>
      <Link
        to="/dashboard"
        className="mt-2 rounded-xl bg-neon-lime px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-midnight transition-opacity hover:opacity-90"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}