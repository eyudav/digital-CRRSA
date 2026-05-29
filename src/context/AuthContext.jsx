import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiJson, setToken } from "@/lib/api";

const AuthContext = createContext(undefined);
const SESSION_KEY = "crrsa-session-v3";

function normalizeUser(u) {
  if (!u) return u;
  return { ...u, id: String(u.id) };
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s?.user) s.user = normalizeUser(s.user);
    return s;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  const user = session?.user ?? null;

  const login = useCallback(async (email, password) => {
    try {
      const data = await apiJson("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(data.token);
      const next = { token: data.token, user: normalizeUser(data.user) };
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
      return { ok: true, user: data.user };
    } catch (e) {
      return { ok: false, message: e.message || "Sign in failed" };
    }
  }, []);

  const register = useCallback(
    async (data) => {
      try {
        await apiJson("/api/auth/register", {
          method: "POST",
          body: {
            fullName: data.fullName,
            email: data.email,
            password: data.password,
            role: data.role,
            phone: data.phone,
            address: data.address,
            subCity: data.subCity,
            woreda: data.woreda,
            sex: data.sex,
            dateOfBirth: data.dateOfBirth,
            motherName: data.motherName,
            fatherName: data.fatherName,
            nationality: data.nationality,
            residenceIdNumber: data.residenceIdNumber,
          },
        });
      } catch (e) {
        const apiErrors = e.data?.errors;
        if (Array.isArray(apiErrors) && apiErrors.length) {
          return {
            ok: false,
            message: apiErrors.map((x) => x.message).join(" "),
            fieldErrors: apiErrors,
          };
        }
        return { ok: false, message: e.message || "Registration failed" };
      }
      const signedIn = await login(data.email, data.password);
      return signedIn.ok ? { ok: true, user: signedIn.user } : signedIn;
    },
    [login]
  );

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    try {
      const data = await apiJson("/api/auth/profile", {
        method: "PATCH",
        body: patch,
      });
      setSession((prev) => {
        if (!prev?.user) return prev;
        const nextUser = normalizeUser(data.user);
        const next = { ...prev, user: nextUser };
        localStorage.setItem(SESSION_KEY, JSON.stringify(next));
        return next;
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message || "Profile update failed" };
    }
  }, []);

  const changePassword = useCallback(async (payload) => {
    try {
      await apiJson("/api/auth/change-password", {
        method: "POST",
        body: payload,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message || "Password change failed" };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token: session?.token ?? null,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, session?.token, login, register, logout, updateProfile, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
