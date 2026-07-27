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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user state on app mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const res = await authApi.getCurrentUser();
          setUser(res.data);
        } catch (_err) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginPayload) => {
    // authApi.login persists tokens to localStorage automatically
    await authApi.login(credentials);

    // Fetch authenticated profile with token in headers
    const profileRes = await authApi.getCurrentUser();
    setUser(profileRes.data);
  };

  const register = async (payload: RegisterPayload): Promise<string> => {
    const res = await authApi.register(payload);
    return res.message;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch (_err) {
      console.warn("Server logout failed, clearing local session anyway.");
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
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
