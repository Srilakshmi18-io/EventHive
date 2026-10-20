import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { db } from '../services/db';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
  isAttendee: boolean;
  canCreateEvents: boolean;
  login: (email: string) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    role: Role;
    organizationName?: string;
  }) => Promise<User>;
  quickLogin: (userId: string) => void;
  logout: () => void;
  demoAccounts: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_SESSION_KEY = 'eventhive_session_user_id';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to Alex Rivera (Attendee) so the app has instant interactivity,
  // but users can switch with one click anywhere.
  const [user, setUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem(CURRENT_USER_SESSION_KEY);
    if (savedId) {
      const found = db.getUserById(savedId);
      if (found) return found;
    }
    // Default fallback to first attendee
    const defaultUser = db.getUserByEmail('alex.rivera@example.com');
    return defaultUser || null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(CURRENT_USER_SESSION_KEY, user.id);
    } else {
      localStorage.removeItem(CURRENT_USER_SESSION_KEY);
    }
  }, [user]);

  const login = async (email: string): Promise<User> => {
    const found = db.getUserByEmail(email.trim());
    if (!found) {
      throw new Error('No account found with this email. Please check your spelling or register.');
    }
    setUser(found);
    return found;
  };

  const register = async (data: {
    name: string;
    email: string;
    role: Role;
    organizationName?: string;
  }): Promise<User> => {
    const existing = db.getUserByEmail(data.email.trim());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      role: data.role,
      organizationName: data.organizationName,
      organizerStatus: data.role === 'ORGANIZER' ? 'APPROVED' : undefined,
      createdAt: new Date().toISOString(),
      avatar: `https://images.unsplash.com/photo-${
        data.role === 'ORGANIZER'
          ? '1534528741775-53994a69daeb'
          : '1535713875002-d1d0cf377fde'
      }?w=150&auto=format&fit=crop&q=80`,
    };

    db.saveUser(newUser);
    setUser(newUser);
    return newUser;
  };

  const quickLogin = (userId: string) => {
    const target = db.getUserById(userId);
    if (target) {
      setUser(target);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isOrganizer = user?.role === 'ORGANIZER';
  const isAttendee = user?.role === 'ATTENDEE';
  const canCreateEvents = isAdmin || (isOrganizer && user?.organizerStatus === 'APPROVED');

  const demoAccounts = db.getUsers();

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isOrganizer,
        isAttendee,
        canCreateEvents,
        login,
        register,
        quickLogin,
        logout,
        demoAccounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
