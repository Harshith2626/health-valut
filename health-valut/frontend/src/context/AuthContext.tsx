import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../api/client";
import { AuthUser, Role } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: Record<string, any>) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUser(rawUser: any): AuthUser | null {
  if (!rawUser) return null;
  if (rawUser.role === "PATIENT" && rawUser.profile) {
    const h = rawUser.profile.height ?? rawUser.profile.heightCm;
    const w = rawUser.profile.weight ?? rawUser.profile.weightKg;
    return {
      ...rawUser,
      profile: {
        ...rawUser.profile,
        height: h,
        heightCm: h,
        weight: w,
        weightKg: w,
      },
    };
  }
  return rawUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hv_token");
    const cached = localStorage.getItem("hv_user");
    if (token && cached) {
      setUser(normalizeUser(JSON.parse(cached)));
      api
        .get("/auth/me")
        .then((res) => {
          const norm = normalizeUser(res.data.user);
          setUser(norm);
          localStorage.setItem("hv_user", JSON.stringify(norm));
        })
        .catch(() => {
          localStorage.removeItem("hv_token");
          localStorage.removeItem("hv_user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    const norm = normalizeUser(res.data.user)!;
    localStorage.setItem("hv_token", res.data.token);
    localStorage.setItem("hv_user", JSON.stringify(norm));
    setUser(norm);
    return norm;
  }

  async function register(data: Record<string, any>) {
    const res = await api.post("/auth/register", data);
    const norm = normalizeUser(res.data.user)!;
    localStorage.setItem("hv_token", res.data.token);
    localStorage.setItem("hv_user", JSON.stringify(norm));
    setUser(norm);
    return norm;
  }

  function logout() {
    localStorage.removeItem("hv_token");
    localStorage.removeItem("hv_user");
    setUser(null);
  }

  async function refreshUser() {
    const res = await api.get("/auth/me");
    const norm = normalizeUser(res.data.user);
    setUser(norm);
    localStorage.setItem("hv_user", JSON.stringify(norm));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function isPatient(role?: Role) {
  return role === "PATIENT";
}
