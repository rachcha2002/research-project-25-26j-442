import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setToken, getToken, removeToken } from '../utils/auth';

interface Doctor {
  doctor_id: string;
  email: string;
  role: string;
  account_status: string;
  [key: string]: any;
}

interface AuthContextType {
  doctor: Doctor | null;
  token: string | null;
  login: (doctor: Doctor, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());

  useEffect(() => {
    if (token && !doctor) {
      // Optionally, fetch doctor profile here using the token
    }
  }, [token, doctor]);

  const login = (doctor: Doctor, token: string) => {
    setDoctor(doctor);
    setToken(token);
    setTokenState(token);
  };

  const logout = () => {
    setDoctor(null);
    removeToken();
    setTokenState(null);
  };

  return (
    <AuthContext.Provider value={{ doctor, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};