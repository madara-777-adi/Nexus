export default function App() {
  console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL);
  return (
    <div className="min-h-screen bg-midnight text-white p-8 flex flex-col items-center justify-center gap-6">
      <div className="bg-surface border border-surface-border p-8 rounded-2xl max-w-md w-full shadow-2xl">
        <span className="font-merkur text-neon-lime text-xl block mb-2">
          {" "}
          Font Test: Merkur Accent
        </span>
        <h1 className="font-neovision text-4xl text-white tracking-wider mb-4">
          FT NEONVISION HEADER
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          If you see this dark Midnoght background, neon lime accents an custom
          fonts, then tailwind is configured properly.
        </p>
        <button className="w-full bg-neon-lime text-midnight font-bold py-3 px-6 rounded-lg font-neovision tracking-wider uppercase hover:opacity-90 transition-opacity">
          ready for Auth Form
        </button>
      </div>
    </div>
  );
}
