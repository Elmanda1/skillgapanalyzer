import React, { createContext, useContext } from 'react';
import { usePage, router } from '@inertiajs/react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Render children and provide a placeholder value to avoid context errors.
  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  // Call usePage() here, which runs inside the Inertia App tree.
  const { auth } = usePage().props;
  const user = auth?.user ? { ...auth.user, role: auth?.role || 'mahasiswa' } : null;

  const logout = () => {
    router.post('/logout');
  };

  return { user, logout };
};
