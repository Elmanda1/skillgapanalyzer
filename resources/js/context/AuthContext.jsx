import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// ─── Demo Accounts ─────────────────────────────────────────────────────────
export const DEMO_USERS = [
  {
    id: 1,
    email: 'admin@pnj.ac.id',
    password: 'pnj2024',
    role: 'institusi',
    name: 'Dr. Siti Rahayu, M.T.',
    institution: 'Politeknik Negeri Jakarta',
    department: 'Teknik Informatika',
    avatarInitials: 'SR',
  },
  {
    id: 2,
    email: 'dosen@pnj.ac.id',
    password: 'dosen2024',
    role: 'dosen',
    name: 'Ir. Budi Hartono, M.Kom.',
    institution: 'Politeknik Negeri Jakarta',
    department: 'Pemrograman Web',
    avatarInitials: 'BH',
  },
  {
    id: 3,
    email: 'mahasiswa@pnj.ac.id',
    password: 'mhs2024',
    role: 'mahasiswa',
    name: 'Ahmad Fauzi',
    institution: 'Politeknik Negeri Jakarta',
    department: 'Teknik Informatika — Semester 6',
    avatarInitials: 'AF',
  },
];

// ─── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sga_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (email, password) => {
    const found = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (found) {
      const { password: _, ...safeUser } = found;
      setUser(safeUser);
      sessionStorage.setItem('sga_user', JSON.stringify(safeUser));
      return { success: true };
    }
    return { success: false, error: 'Email atau password tidak valid.' };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('sga_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
