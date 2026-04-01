import { createContext, useContext, useEffect, useState } from "react";
import { saveAuth, clearAuth, getToken, getUser } from "./storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, user: null, loading: true });

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const token = getToken();
    const user = getUser();
    setAuth({ token, user, loading: false });
  }, []);

  const login = (token, user) => {
    saveAuth({ token, user });
    setAuth({ token, user, loading: false });
  };

  const logout = () => {
    clearAuth();
    setAuth({ token: null, user: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
