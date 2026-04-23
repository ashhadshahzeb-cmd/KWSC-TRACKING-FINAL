import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// ========== DEPARTMENT USERS ==========
// Predefined credentials for each KW&SB Finance section
export interface DepartmentUser {
  email: string;
  password: string;
  roleId: string;
  displayName: string;
}

export const DEPARTMENT_USERS: DepartmentUser[] = [
  { email: 'cfo@kwsb.gov.pk',              password: 'cfo@12345',    roleId: 'cfo',              displayName: 'CFO' },
  { email: 'cia@kwsb.gov.pk',              password: 'cia@12345',    roleId: 'cia',              displayName: 'CIA' },
  { email: 'budget@kwsb.gov.pk',           password: 'budget@12345', roleId: 'budget',            displayName: 'BUDGET' },
  { email: 'pension@kwsb.gov.pk',          password: 'pension@12345',roleId: 'pension',           displayName: 'PENSION' },
  { email: 'fund@kwsb.gov.pk',             password: 'fund@12345',   roleId: 'fund',              displayName: 'FUND' },
  { email: 'audit1@kwsb.gov.pk',           password: 'audit1@12345', roleId: 'internal_audit_1',  displayName: 'INTERNAL AUDIT-1' },
  { email: 'director.account@kwsb.gov.pk', password: 'da@12345',     roleId: 'director_account',  displayName: 'DIRECTOR ACCOUNT' },
  { email: 'director.finance@kwsb.gov.pk', password: 'df@12345',     roleId: 'director_finance',  displayName: 'DIRECTOR FINANCE' },
  { email: 'director.it@kwsb.gov.pk',      password: 'dit@12345',    roleId: 'director_it',       displayName: 'DIRECTOR IT' },
  { email: 'subcfo@kwsb.gov.pk',           password: 'sub@12345',     roleId: 'sub_cfo',           displayName: 'ASST. CFO' },
  { email: 'books@kwsb.gov.pk',            password: 'books@12345',   roleId: 'books',             displayName: 'BOOKS' },
  { email: 'establishment@kwsb.gov.pk',    password: 'est@12345',     roleId: 'establishment',     displayName: 'ESTABLISHMENT' },
];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  // Department-specific fields
  userRole: string | null;       // e.g. 'cfo', 'cia', 'director_account'
  userName: string | null;       // e.g. 'CFO', 'DIRECTOR ACCOUNT'
  localSignIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  isLocalAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_AUTH_KEY = 'kwsb_local_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Local department auth state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLocalAuth, setIsLocalAuth] = useState(false);

  useEffect(() => {
    // 1) Check for local department auth first
    const savedLocal = localStorage.getItem(LOCAL_AUTH_KEY);
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        setUserRole(parsed.roleId);
        setUserName(parsed.displayName);
        setIsLocalAuth(true);
        setIsAdmin(parsed.roleId === 'cfo');
        setLoading(false);
        return; // skip Supabase if local auth is active
      } catch {
        localStorage.removeItem(LOCAL_AUTH_KEY);
      }
    }

    // 2) Fallback to Supabase auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
        const match = DEPARTMENT_USERS.find(u => u.email === session.user.email?.toLowerCase());
        if (match) {
           setUserRole(match.roleId);
           setUserName(match.displayName);
        } else {
           const prefix = session.user.email?.split('@')[0].toLowerCase() || '';
           const fallbackMatch = DEPARTMENT_USERS.find(u => u.roleId === prefix || u.roleId.replace('_', '') === prefix);
           if (fallbackMatch) {
              setUserRole(fallbackMatch.roleId);
              setUserName(fallbackMatch.displayName);
           }
        }
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
        const match = DEPARTMENT_USERS.find(u => u.email === session.user.email?.toLowerCase());
        if (match) {
           setUserRole(match.roleId);
           setUserName(match.displayName);
        } else {
           // Default fallback based on email prefix if not exactly matched
           const prefix = session.user.email?.split('@')[0].toLowerCase() || '';
           const fallbackMatch = DEPARTMENT_USERS.find(u => u.roleId === prefix || u.roleId.replace('_', '') === prefix);
           if (fallbackMatch) {
              setUserRole(fallbackMatch.roleId);
              setUserName(fallbackMatch.displayName);
           }
        }
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (data && data.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error checking admin role:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // Local department login
  const localSignIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimEmail = email.trim().toLowerCase();
    const trimPass = password.trim();

    const match = DEPARTMENT_USERS.find(
      u => u.email === trimEmail && u.password === trimPass
    );

    if (!match) {
      return { success: false, error: 'Invalid email or password. Please check your credentials.' };
    }

    // Save to localStorage
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({
      roleId: match.roleId,
      displayName: match.displayName,
      email: match.email,
    }));

    setUserRole(match.roleId);
    setUserName(match.displayName);
    setIsLocalAuth(true);
    setIsAdmin(match.roleId === 'cfo');

    return { success: true };
  };

  const signOut = async () => {
    // Clear local auth
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setUserRole(null);
    setUserName(null);
    setIsLocalAuth(false);
    setIsAdmin(false);

    // Also sign out from Supabase
    await supabase.auth.signOut();
  };

  // If we have local auth OR supabase session, we're authenticated
  const effectiveSession = isLocalAuth ? ({} as Session) : session;

  return (
    <AuthContext.Provider value={{ 
      session: effectiveSession, 
      user, 
      loading, 
      signOut, 
      isAdmin,
      userRole,
      userName,
      localSignIn,
      isLocalAuth,
    }}>
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
