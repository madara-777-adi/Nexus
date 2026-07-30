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

  const handleLogout = () => {
    setIsOpen(false);
    logout();
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
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-gray-800 bg-[#12141A] p-1.5 pr-3 transition-all duration-200 hover:border-gray-700 hover:bg-[#181B22]"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00E5FF]/10 text-xs font-semibold text-[#00E5FF]">
          {getUserInitials()}
        </div>
        <span className="text-xs font-medium text-gray-200">{fullName}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 animate-in fade-in slide-in-from-top-2 rounded-xl border border-gray-800 bg-[#12141A] p-1.5 shadow-2xl duration-150">
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
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-[#181B22] hover:text-white"
          >
            <User className="h-3.5 w-3.5 text-[#00E5FF]" />
            <span>Profile Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/30 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};