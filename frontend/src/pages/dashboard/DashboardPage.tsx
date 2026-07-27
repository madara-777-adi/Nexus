import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-midnight text-white p-8 flex flex-col items-center justify-center font-sans">
      <div className="bg-surface border border-surface-border p-8 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-surface-border pb-4">
          <div>
            <span className="font-merkur text-neon-lime text-lg block">
              Identity Authenticated
            </span>
            <h1 className="font-neovision text-3xl tracking-wider text-white">
              NEXUS DASHBOARD
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500/10 text-red-400 border border-red-500/30 font-neovision px-6 py-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all cursor-pointer uppercase text-sm tracking-wider"
          >
            Log Out
          </button>
        </div>

        {user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-midnight p-4 rounded-xl border border-surface-border">
              <span className="text-gray-400 block text-xs mb-1">
                User Identifier
              </span>
              <span className="font-mono text-neon-lime font-semibold">
                {user.userId}
              </span>
            </div>

            <div className="bg-midnight p-4 rounded-xl border border-surface-border">
              <span className="text-gray-400 block text-xs mb-1">
                Full Name
              </span>
              <span className="text-white font-medium">
                {user.firstName} {user.lastName}
              </span>
            </div>

            <div className="bg-midnight p-4 rounded-xl border border-surface-border">
              <span className="text-gray-400 block text-xs mb-1">
                Email Address
              </span>
              <span className="text-white font-medium">{user.email}</span>
            </div>

            <div className="bg-midnight p-4 rounded-xl border border-surface-border">
              <span className="text-gray-400 block text-xs mb-1">
                Account Status
              </span>
              <span className="text-neon-lime font-medium uppercase text-xs">
                {user.accountStatus}
              </span>
            </div>
          </div>
        )}

        <div className="bg-midnight/60 border border-neon-lime/20 p-6 rounded-2xl flex flex-col gap-2">
          <h2 className="font-neovision text-lg text-neon-lime">
            WORKSPACE MODULE PLACEHOLDER
          </h2>
          <p className="text-gray-400 text-xs leading-relaxed">
            Frontend & Backend Identity Modules are 100% complete and connected.
            Next: Workspace construction!
          </p>
        </div>
      </div>
    </div>
  );
}
