
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// This is a placeholder for Supabase integration
// You'll need to connect with Supabase to implement the actual authentication
interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user in localStorage (temporary solution)
    const storedUser = localStorage.getItem('milma-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // This is a mockup for the sign-in functionality
  // Replace with Supabase auth when connected
  const signIn = async (email: string, password: string) => {
    try {
      // Simulate authentication
      // Will be replaced with actual Supabase auth
      if (email && password.length >= 6) {
        const mockUser = {
          id: 'temp-user-id',
          email: email,
          name: email.split('@')[0]
        };
        
        setUser(mockUser);
        localStorage.setItem('milma-user', JSON.stringify(mockUser));
        toast.success("Signed in successfully!");
        return;
      }
      throw new Error("Invalid credentials");
    } catch (error) {
      toast.error("Failed to sign in. Please check your credentials.");
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('milma-user');
    toast.info("Signed out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
