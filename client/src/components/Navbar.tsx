import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Building2,
  UserCheck,
  ChevronDown,
  AlertTriangle,
  X,
  Phone,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  collapsed: boolean;
  onOpenLeadDetail?: (leadId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ collapsed, onOpenLeadDetail }) => {
  const { user, isSuperAdmin, workspaces, activeWorkspaceId, switchWorkspace, viewAsUserId, setViewAsUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Health warnings state
  const [warnings, setWarnings] = useState<any[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Workspaces dropdown
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  // View-as-user dropdown
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [showViewAsMenu, setShowViewAsMenu] = useState(false);

  useEffect(() => {
    // Fetch notifications & warnings
    const fetchAlerts = async () => {
      try {
        const [wRes, nRes] = await Promise.all([
          api.getHealthWarnings(),
          api.getNotifications(),
        ]);
        setWarnings(wRes.warnings || []);
        setNotifications(nRes.notifications || []);
        setUnreadCount(nRes.unreadCount || 0);

        if (isSuperAdmin) {
          const uRes = await api.getUsers();
          setTeamUsers(uRes.users.filter((u: any) => u.role === 'TEAM_MEMBER'));
        }
      } catch (e) {
        console.error('Navbar alerts error:', e);
      }
    };

    fetchAlerts();
  }, [isSuperAdmin]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.getLeads({ search: searchQuery, limit: 5 });
        setSearchResults(res.leads || []);
        setShowSearchResults(true);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLead = (id: string) => {
    setShowSearchResults(false);
    setSearchQuery('');
    if (onOpenLeadDetail) {
      onOpenLeadDetail(id);
    } else {
      navigate(`/leads?leadId=${id}`);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await api.markNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-wellness-border dark:border-slate-800 transition-all duration-300 ease-in-out px-4 sm:px-6 flex items-center justify-between ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Workspace & View-as Switcher */}
      <div className="flex items-center gap-3">
        {/* Workspace Switcher */}
        {isSuperAdmin ? (
          <div className="relative">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-wellness-border dark:border-slate-700 bg-wellness-50 dark:bg-slate-800/80 text-xs font-semibold text-wellness-900 dark:text-emerald-300 hover:bg-wellness-100 transition-colors shadow-sm"
            >
              <Building2 size={15} className="text-wellness-600 dark:text-emerald-400" />
              <span className="max-w-[140px] sm:max-w-[180px] truncate">
                {activeWorkspaceId === 'all'
                  ? 'All Workspaces'
                  : workspaces.find((w) => w.id === activeWorkspaceId)?.name || 'Select Workspace'}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-700 rounded-xl shadow-soft-lg py-1.5 z-50">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Switch Workspace
                </div>
                <button
                  onClick={() => {
                    switchWorkspace('all');
                    setShowWorkspaceMenu(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-wellness-50 dark:hover:bg-slate-800 transition-colors ${
                    activeWorkspaceId === 'all' ? 'font-bold text-wellness-600 dark:text-emerald-400 bg-wellness-50/60 dark:bg-slate-800/60' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>🌐 All Workspaces (Global)</span>
                  {activeWorkspaceId === 'all' && <span className="w-2 h-2 rounded-full bg-wellness-600"></span>}
                </button>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setShowWorkspaceMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-wellness-50 dark:hover:bg-slate-800 transition-colors ${
                      activeWorkspaceId === ws.id ? 'font-bold text-wellness-600 dark:text-emerald-400 bg-wellness-50/60 dark:bg-slate-800/60' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {activeWorkspaceId === ws.id && <span className="w-2 h-2 rounded-full bg-wellness-600"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-wellness-border dark:border-slate-700 bg-wellness-50 dark:bg-slate-800/60 text-xs font-semibold text-wellness-900 dark:text-emerald-300">
            <Building2 size={15} className="text-wellness-600 dark:text-emerald-400" />
            <span className="max-w-[150px] truncate">
              {user?.workspace?.name || 'WELLWITH CRM'}
            </span>
          </div>
        )}

        {/* View-as User Switcher (Super Admin only) */}
        {isSuperAdmin && (
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowViewAsMenu(!showViewAsMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                viewAsUserId
                  ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <UserCheck size={14} className={viewAsUserId ? 'text-amber-600' : 'text-slate-400'} />
              <span>
                {viewAsUserId
                  ? `Viewing as: ${teamUsers.find((u) => u.id === viewAsUserId)?.name || 'User'}`
                  : 'View as User'}
              </span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {showViewAsMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-soft-lg py-1.5 z-50">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Simulate Team Member View
                </div>
                <button
                  onClick={() => {
                    setViewAsUser(null);
                    setShowViewAsMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>Reset to Full Super Admin</span>
                  {!viewAsUserId && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                </button>
                {teamUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setViewAsUser(u.id);
                      setShowViewAsMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between ${
                      viewAsUserId === u.id ? 'font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{u.name} (Telecaller)</span>
                    {viewAsUserId === u.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center: Global Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md mx-4 hidden sm:block">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, phone (+91), or goal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowSearchResults(true);
            }}
            className="w-full pl-10 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-700 rounded-xl shadow-soft-lg py-2 z-50 max-h-80 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-500 text-center">
                {isSearching ? 'Searching...' : 'No matching leads found.'}
              </div>
            ) : (
              searchResults.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => handleSelectLead(lead.id)}
                  className="w-full px-4 py-2.5 text-left hover:bg-wellness-50 dark:hover:bg-slate-800 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 last:border-none transition-colors"
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {lead.name}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{lead.phone}</span>
                      <span>•</span>
                      <span className="text-wellness-700 dark:text-emerald-400 font-medium">
                        {lead.wellnessGoal}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <Flame size={12} /> {lead.heatScore}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {lead.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Notifications, Warnings, Theme & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Health Warnings Bell */}
        <div className="relative">
          <button
            onClick={() => setShowWarnings(!showWarnings)}
            className={`p-2 rounded-xl transition-colors relative ${
              warnings.length > 0
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-100'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Lead Health Warnings"
          >
            <AlertTriangle size={18} />
            {warnings.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </button>

          {showWarnings && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-soft-lg p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-500" /> Lead Health Alerts
                </span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                  {warnings.length} Active
                </span>
              </div>
              <div className="space-y-2">
                {warnings.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">All lead health metrics normal. Great job! 🌿</p>
                ) : (
                  warnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs"
                    >
                      <p className="font-semibold text-amber-900 dark:text-amber-300">{w.title}</p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">{w.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-wellness-600 text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-700 rounded-xl shadow-soft-lg p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkNotificationsRead}
                    className="text-[11px] text-wellness-600 hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg text-xs transition-colors ${
                        n.isRead ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400' : 'bg-wellness-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium'
                      }`}
                    >
                      <p className="font-semibold">{n.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
