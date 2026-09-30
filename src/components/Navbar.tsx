'use client';

import React, { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { UserRole } from '@/types/crm';
import {
  Flame,
  Kanban,
  Users,
  ShoppingCart,
  Clock,
  BarChart3,
  Settings,
  Volume2,
  VolumeX,
  Play,
  Sparkles,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewLead: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenNewLead }) => {
  const {
    currentUser,
    switchRole,
    audioAlertEnabled,
    setAudioAlertEnabled,
    leads,
    simulateIncomingMetaLead,
  } = useCrm();

  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  // Count active hot leads that are New or Contacted
  const hotLeadsCount = leads.filter(
    (l) => l.lead_score === 'Hot' && (l.stage === 'New' || l.stage === 'Contacted')
  ).length;

  const roles: { role: UserRole; title: string; badge: string; desc: string }[] = [
    { role: 'owner', title: 'Dr. Vikram Rao', badge: '👑 Owner', desc: 'Full access, revenue, compliance & settings' },
    { role: 'manager', title: 'Ananya Sharma', badge: '💼 Manager', desc: 'Lead assignment, pipeline & CSV export' },
    { role: 'closer', title: 'Rohit Reddy', badge: '📞 Closer / Store Staff', desc: 'Assigned leads & Hot queue, POS order entry' },
    { role: 'viewer', title: 'Arjun Board Member', badge: '👁️ Viewer', desc: 'Read-only analytics & executive reports' },
  ];

  const navItems = [
    { id: 'hot-queue', label: 'Hot Queue', icon: Flame, badge: hotLeadsCount > 0 ? hotLeadsCount : null },
    { id: 'pipeline', label: 'Pipeline Board', icon: Kanban },
    { id: 'leads', label: 'Leads Directory', icon: Users },
    { id: 'pos', label: 'Counter Order (POS)', icon: ShoppingCart },
    { id: 'follow-ups', label: 'Follow-ups & Reorders', icon: Clock },
    { id: 'dashboard', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'admin', label: 'Settings & n8n', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-emerald-100 shadow-sm">
      {/* Top Emerald Brand Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-4 py-1.5 text-xs flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-medium tracking-wide">
            Wellwith Omni-channel Clinic & Telecaller Suite • Mumbai Region (ap-south-1)
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-100">
            <span>SLA Target:</span>
            <span className="bg-emerald-950/60 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold text-[11px]">
              &lt; 90s speed-to-call
            </span>
          </div>
          <button
            onClick={() => setAudioAlertEnabled(!audioAlertEnabled)}
            className="flex items-center gap-1 text-emerald-200 hover:text-white transition-colors"
            title={audioAlertEnabled ? 'Sound alert enabled for Hot leads' : 'Sound alert muted'}
          >
            {audioAlertEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-300" /> : <VolumeX className="w-3.5 h-3.5 text-rose-300" />}
            <span className="text-[11px]">{audioAlertEnabled ? 'Chime On' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-card shadow-emerald-500/20">
              <span className="text-xl font-black tracking-tight">W</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-slate-900 tracking-tight">Wellwith</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  CRM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Ayurvedic Wellness & Clinic Operations</p>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Simulation Sandbox Trigger */}
            <div className="relative">
              <button
                onClick={() => setSimulatorOpen(!simulatorOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simulate Webhook</span>
                <ChevronDown className="w-3 h-3 text-emerald-600" />
              </button>

              {simulatorOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    n8n & Meta Webhook Sandbox
                  </div>
                  <button
                    onClick={() => {
                      simulateIncomingMetaLead('hot');
                      setSimulatorOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center gap-2 text-slate-700 hover:text-emerald-800"
                  >
                    <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Incoming Meta Hot Lead</div>
                      <div className="text-[10px] text-slate-500">Triggers 90s countdown & audio alert</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      simulateIncomingMetaLead('pregnancy');
                      setSimulatorOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center gap-2 text-slate-700 hover:text-purple-800"
                  >
                    <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Medical Escalation Lead</div>
                      <div className="text-[10px] text-slate-500">Pregnancy keyword triggers AI pause</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      simulateIncomingMetaLead('invalid');
                      setSimulatorOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <span className="w-4 text-center font-bold text-slate-400">🚫</span>
                    <div>
                      <div className="font-semibold text-slate-800">Invalid Phone Number</div>
                      <div className="text-[10px] text-slate-500">Test intake auto-cleaner trigger</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* New Lead Quick Button (Hidden for Viewer) */}
            {currentUser.role !== 'viewer' && (
              <button
                onClick={onOpenNewLead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
              >
                <span>+ New Lead</span>
              </button>
            )}

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
              >
                <span className="text-base">{currentUser.avatar || '👤'}</span>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    {currentUser.name}
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      {currentUser.role.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Role Preview Switcher</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Simulate Logged-in Role
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 hover:bg-emerald-50 flex items-start gap-2.5 transition-colors ${
                        currentUser.role === r.role ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{r.title}</span>
                          <span className="text-[11px] font-medium text-emerald-700">{r.badge}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-100 text-sm no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
