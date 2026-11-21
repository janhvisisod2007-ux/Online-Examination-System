import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      localStorage.removeItem("user");
      return null;
    }
  });

  const saveUser = (data) => {
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);

    // Set token for future API requests
    if (data.token) {
      api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    }

    return data;
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    return saveUser(data);
  };

  const register = async (form) => {
    const { data } = await api.post("/auth/register", form);

    return saveUser(data);
  };

  const logout = () => {
    localStorage.removeItem("user");
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);