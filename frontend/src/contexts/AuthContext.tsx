import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  authApi,
  type LoginPayload,
  type RegisterPayload,
} from "../api/auth.api";

export interface IUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  provider?: "LOCAL" | "GOOGLE" | "GITHUB";
  role: "USER" | "ADMIN";
  bio?: string;
  isEmailVerified: boolean;
  accountStatus: string;
}

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuth: () => Promise<void>; // Alias for backwards compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Re-fetch current user profile from backend and update context state
  const refreshUser = async () => {
    try {
      const res = await authApi.getCurrentUser();
      const userData = res.data || res;
      if (userData && (userData.userId || userData._id)) {
        setUser(userData);
      }
    } catch (_err) {
      setUser(null);
    }
  };

  // Hydrate user state on app mount using HttpOnly cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Refresh access token via HttpOnly cookie
        await authApi.refreshToken();

        // 2. Fetch authenticated user profile
        await refreshUser();
      } catch (_err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginPayload) => {
    const res = await authApi.login(credentials);
    const userData = res.data;

    if (userData && (userData.userId || userData._id)) {
      setUser(userData);
    } else {
      // Fallback fetch if profile wasn't fully included in login response
      await refreshUser();
    }
  };

  const register = async (payload: RegisterPayload): Promise<string> => {
    const res = await authApi.register(payload);
    return res.message;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (_err) {
      console.warn(
        "Server logout failed, clearing local session state anyway.",
      );
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        checkAuth: refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};