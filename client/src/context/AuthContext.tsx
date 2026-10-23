import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace } from '../types/crm';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  viewAsUserId: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchWorkspace: (workspaceId: string) => void;
  setViewAsUser: (userId: string | null) => void;
  isSuperAdmin: boolean;
  isClientAdmin: boolean;
  isTelecaller: boolean;
  canAccessAiTelecalling: boolean;
  currentWorkspace: Workspace | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('wellwith_token'));
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(
    localStorage.getItem('wellwith_active_workspace_id') || 'all'
  );
  const [viewAsUserId, setViewAsUserState] = useState<string | null>(
    localStorage.getItem('wellwith_view_as_user_id')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('wellwith_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          setWorkspaces(res.workspaces || []);
          if (res.user.role !== 'SUPER_ADMIN' && res.user.workspaceId) {
            setActiveWorkspaceId(res.user.workspaceId);
            localStorage.setItem('wellwith_active_workspace_id', res.user.workspaceId);
          }
        } catch (e) {
          console.error('Failed to restore session:', e);
          localStorage.removeItem('wellwith_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setToken(res.token);
      setUser(res.user);
      setWorkspaces(res.workspaces || []);
      localStorage.setItem('wellwith_token', res.token);

      const defaultWs = res.user.role === 'SUPER_ADMIN' ? 'all' : res.user.workspaceId || 'all';
      setActiveWorkspaceId(defaultWs);
      localStorage.setItem('wellwith_active_workspace_id', defaultWs);
      localStorage.removeItem('wellwith_view_as_user_id');
      setViewAsUserState(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('wellwith_token');
    localStorage.removeItem('wellwith_active_workspace_id');
    localStorage.removeItem('wellwith_view_as_user_id');
    setToken(null);
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspaceId('all');
    setViewAsUserState(null);
    window.location.href = '/login';
  };

  const switchWorkspace = (wsId: string) => {
    setActiveWorkspaceId(wsId);
    localStorage.setItem('wellwith_active_workspace_id', wsId);
    // Reload active queries
    window.location.reload();
  };

  const setViewAsUser = (userId: string | null) => {
    setViewAsUserState(userId);
    if (userId) {
      localStorage.setItem('wellwith_view_as_user_id', userId);
    } else {
      localStorage.removeItem('wellwith_view_as_user_id');
    }
    window.location.reload();
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isClientAdmin = user?.role === 'CLIENT_ADMIN';
  const isTelecaller = user?.role === 'TEAM_MEMBER';

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  // Check if active workspace has ai_telecalling_enabled flag
  const aiFlag = currentWorkspace?.featureFlags?.find((f) => f.key === 'ai_telecalling_enabled');
  const canAccessAiTelecalling = isSuperAdmin && (activeWorkspaceId === 'all' || aiFlag?.enabled === true);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        workspaces,
        activeWorkspaceId,
        viewAsUserId,
        isLoading,
        login,
        logout,
        switchWorkspace,
        setViewAsUser,
        isSuperAdmin,
        isClientAdmin,
        isTelecaller,
        canAccessAiTelecalling,
        currentWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
