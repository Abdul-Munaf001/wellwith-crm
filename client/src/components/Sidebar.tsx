import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Flame,
  CalendarCheck,
  Calendar,
  RefreshCw,
  Megaphone,
  BarChart3,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user, isSuperAdmin, isClientAdmin, canAccessAiTelecalling, currentWorkspace, activeWorkspaceId, viewAsUserId } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/leads', label: 'Leads & Pipeline', icon: Users },
    { to: '/focus', label: "Today's Focus", icon: Flame, badge: 'Smart' },
    { to: '/followups', label: 'Follow-ups', icon: CalendarCheck },
    { to: '/consultations', label: 'Consultations', icon: Calendar },
    { to: '/renewals', label: 'Renewals & Retention', icon: RefreshCw },
    ...(!isSuperAdmin && !isClientAdmin
      ? []
      : [{ to: '/campaigns', label: 'Campaigns & Ads', icon: Megaphone }]),
    ...(isSuperAdmin
      ? [{ to: '/team', label: 'Team Activity', icon: BarChart3 }]
      : []),
    ...(canAccessAiTelecalling
      ? [{ to: '/ai-telecalling', label: 'AI Telecalling', icon: Bot, isSpecial: true }]
      : []),
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 border-r border-wellness-border dark:border-slate-800 flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-wellness-border dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-wellness-100 dark:bg-emerald-950/60 border border-wellness-200 dark:border-emerald-800 flex items-center justify-center flex-shrink-0 text-xl shadow-soft">
              🌿
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-wellness-900 dark:text-emerald-400 font-sans">
                  WELLWITH
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-wellness-700 dark:text-emerald-500/80 -mt-1">
                  Wellness CRM
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-wellness-50 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* View-as-user banner */}
        {viewAsUserId && !collapsed && (
          <div className="mx-3 mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert size={15} className="flex-shrink-0 text-amber-600" />
            <span className="truncate font-medium">Viewing as Team Member</span>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                    isActive
                      ? item.isSpecial
                        ? 'bg-purple-600 text-white shadow-soft font-semibold'
                        : 'bg-wellness-600 text-white shadow-soft font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-wellness-50 dark:hover:bg-slate-800/60 hover:text-wellness-900 dark:hover:text-emerald-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={20}
                      className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-wellness-600 dark:group-hover:text-emerald-400'
                      }`}
                    />
                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                        {item.badge}
                      </span>
                    )}
                    {!collapsed && item.isSpecial && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Admin
                      </span>
                    )}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-wellness-border dark:border-slate-800 bg-wellness-50/50 dark:bg-slate-900/50">
        {!collapsed ? (
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-wellness-border dark:border-slate-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-wellness-100 dark:bg-emerald-950 text-wellness-800 dark:text-emerald-300 font-bold flex items-center justify-center text-sm">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize truncate">
                {user?.role?.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-full bg-wellness-100 dark:bg-emerald-950 text-wellness-800 dark:text-emerald-300 font-bold flex items-center justify-center text-sm shadow-sm">
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
