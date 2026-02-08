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
    const storedToken = getToken();
    const storedDoctor = localStorage.getItem('doctor');
    if (storedToken && storedDoctor) {
      setTokenState(storedToken);
      setDoctor(JSON.parse(storedDoctor));
    }
  }, []);

  const login = (doctorData: Doctor, jwt: string) => {
    setTokenState(jwt);
    setToken(jwt);
    setDoctor(doctorData);
    localStorage.setItem('doctor', JSON.stringify(doctorData));
  };

  const logout = () => {
    setTokenState(null);
    removeToken();
    setDoctor(null);
    localStorage.removeItem('doctor');
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