import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate("/login");
  };

  const fullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : "User";

  const getUserInitials = () => {
    if (!user?.firstName) return "U";
    const firstInitial = user.firstName[0] || "";
    const lastInitial = user.lastName ? user.lastName[0] : "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Avatar Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-800 bg-[#12141A] p-1.5 pr-3 transition-all duration-200 hover:border-gray-700 hover:bg-[#181B22] cursor-pointer"
      >
        <div className="flex h-8 w-8 min-w-8 items-center justify-center rounded-lg bg-[#00E5FF]/10 text-xs font-semibold text-[#00E5FF]">
          {getUserInitials()}
        </div>
        <span className="hidden max-w-[140px] truncate text-xs font-medium text-gray-200 sm:inline-block">
          {fullName}
        </span>
        <ChevronDown
          className={`hidden h-3.5 w-3.5 text-gray-500 transition-transform duration-200 sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-800 bg-[#12141A] p-1.5 shadow-2xl transition-all duration-150 animate-in fade-in slide-in-from-top-2">
          <div className="mb-1 border-b border-gray-800/80 px-3 py-2">
            <p className="truncate text-xs font-medium text-white font-sans">
              {fullName}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-gray-500">
              {user?.email || "user@example.com"}
            </p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate("/profile");
            }}
            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-[#181B22] hover:text-white cursor-pointer"
          >
            <User className="h-3.5 w-3.5 text-[#00E5FF]" />
            <span>Profile Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/30 hover:text-red-300 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
