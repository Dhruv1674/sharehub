import React, { createContext, useContext, useState } from "react";
import api from "../api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user,setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("sharehub_user")); } catch { return null; } });
  const [loading,setLoading] = useState(false);
  async function login(email,password) {
    const {data} = await api.post("/auth/login",{email,password});
    localStorage.setItem("sharehub_token",data.token); localStorage.setItem("sharehub_user",JSON.stringify(data.user)); setUser(data.user);
  }
  async function register(payload) {
    const {data} = await api.post("/auth/register",payload);
    localStorage.setItem("sharehub_token",data.token); localStorage.setItem("sharehub_user",JSON.stringify(data.user)); setUser(data.user);
  }
  function logout(){ localStorage.removeItem("sharehub_token"); localStorage.removeItem("sharehub_user"); setUser(null); }
  return <AuthContext.Provider value={{user,loading,login,register,logout}}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
