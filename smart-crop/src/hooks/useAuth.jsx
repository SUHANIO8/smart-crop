import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("sc_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [token, setToken] = useState(() => {
    try { return localStorage.getItem("sc_token") || null; }
    catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem("sc_user", JSON.stringify(user));
    else localStorage.removeItem("sc_user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("sc_token", token);
    else localStorage.removeItem("sc_token");
  }, [token]);

  const login = (payload) => {
    if (!payload) return;
    if (payload.token && payload.user) {
      setToken(payload.token);
      setUser(payload.user);
    } else {
      setToken(`mock-token-${Date.now()}`);
      setUser(payload);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    navigate("/", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
