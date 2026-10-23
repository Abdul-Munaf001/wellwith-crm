import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Users,
  Building2,
  Package,
  Flag,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  CheckCircle2,
  Shield,
  Palette,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, isSuperAdmin, isClientAdmin, workspaces, currentWorkspace } = useAuth();

  const [activeTab, setActiveTab] = useState<'programs' | 'users' | 'workspaces' | 'featureFlags' | 'audit'>('programs');
  const [programs, setPrograms] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Program modal
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [programForm, setProgramForm] = useState({
    name: '',
    category: 'Weight Loss',
    price: '',
    durationDays: '30',
    description: '',
    talkingPoints: '',
  });

  // New User modal
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    role: 'TEAM_MEMBER',
    phone: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, uRes, fRes] = await Promise.all([
        api.getPrograms(),
        api.getUsers(),
        api.getFeatureFlags(),
      ]);
      setPrograms(pRes.programs || []);
      setUsersList(uRes.users || []);
      setFeatureFlags(fRes.flags || []);

      if (isSuperAdmin) {
        const aRes = await api.getAuditLogs();
        setAuditLogs(aRes.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleFlag = async (flag: any) => {
    try {
      await api.toggleFeatureFlag({
        workspaceId: flag.workspaceId,
        key: flag.key,
        enabled: !flag.enabled,
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProgram(programForm);
      setShowAddProgram(false);
      setProgramForm({
        name: '',
        category: 'Weight Loss',
        price: '',
        durationDays: '30',
        description: '',
        talkingPoints: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create program');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(userForm);
      setShowAddUser(false);
      setUserForm({
        name: '',
        email: '',
        password: 'Password123!',
        role: 'TEAM_MEMBER',
        phone: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-sans">
            CRM Settings & Administration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure programs catalog, user roles, feature flags, and multi-workspace branding
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 text-xs font-semibold shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 rounded-xl p-1 w-fit shadow-sm flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('programs')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'programs' ? 'bg-wellness-600 text-white shadow-soft' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Package size={14} /> Programs Catalog ({programs.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users' ? 'bg-wellness-600 text-white shadow-soft' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Users size={14} /> User Accounts ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('workspaces')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'workspaces' ? 'bg-wellness-600 text-white shadow-soft' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Building2 size={14} /> Workspaces & Branding
        </button>
        {isSuperAdmin && (
          <>
            <button
              onClick={() => setActiveTab('featureFlags')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'featureFlags' ? 'bg-wellness-600 text-white shadow-soft' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Flag size={14} /> Feature Flags
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'audit' ? 'bg-wellness-600 text-white shadow-soft' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileSpreadsheet size={14} /> Audit Trail
            </button>
          </>
        )}
      </div>

      {/* TAB 1: PROGRAMS CATALOG */}
      {activeTab === 'programs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">Packages recommended to leads by caller talk tracks</p>
            {(isSuperAdmin || isClientAdmin) && (
              <button
                onClick={() => setShowAddProgram(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-wellness-600 text-white text-xs font-bold shadow-soft"
              >
                <Plus size={14} /> Add Program
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft space-y-3"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-wellness-100 text-wellness-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {p.category}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                    ₹{p.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400">/ {p.durationDays} days</span>
                </div>

                {p.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {p.description}
                  </p>
                )}

                {p.talkingPoints && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Caller Talking Points
                    </span>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg italic">
                      "{p.talkingPoints}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">Manage telecallers, managers and client credentials</p>
            {(isSuperAdmin || isClientAdmin) && (
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-wellness-600 text-white text-xs font-bold shadow-soft"
              >
                <Plus size={14} /> Invite User
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Name & Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Workspace</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      <div>{u.name}</div>
                      <div className="text-[11px] font-normal text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {u.workspace?.name || 'All (HQ Super Admin)'}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {u.phone || 'N/A'}
                    </td>
                    <td className="p-3.5">
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={13} /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WORKSPACES */}
      {activeTab === 'workspaces' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Complete data isolation between agency HQ and client brands</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-sm"
                      style={{ backgroundColor: ws.customTheme || '#16A34A' }}
                    >
                      {ws.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{ws.name}</h3>
                      <p className="text-[11px] text-slate-400">Slug: {ws.slug}</p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div>Leads in Workspace: <strong className="text-slate-900 dark:text-slate-100">{ws._count?.leads || 0}</strong></div>
                  <div>Assigned Users: <strong className="text-slate-900 dark:text-slate-100">{ws._count?.users || 0}</strong></div>
                  <div className="truncate">Secret Webhook Token: <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{ws.secretWebhookToken}</code></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FEATURE FLAGS (SUPER ADMIN ONLY) */}
      {activeTab === 'featureFlags' && isSuperAdmin && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Control feature accessibility per workspace (e.g. AI Telecalling)</p>
          <div className="bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 rounded-2xl shadow-soft divide-y divide-slate-100 dark:divide-slate-800">
            {featureFlags.map((flag) => (
              <div key={flag.id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{flag.key}</h4>
                  <p className="text-xs text-slate-500">{flag.description || 'Feature flag'}</p>
                </div>
                <button
                  onClick={() => handleToggleFlag(flag)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    flag.enabled
                      ? 'bg-wellness-600 text-white shadow-soft'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {flag.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
          <div className="p-4 border-b border-wellness-border dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">System Activity & Audit Trail</h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">User</th>
                <th className="p-3">Details</th>
                <th className="p-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{log.action}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{log.entity}</td>
                  <td className="p-3 text-wellness-700 dark:text-emerald-400 font-semibold">{log.user?.name || 'System'}</td>
                  <td className="p-3 text-slate-500 max-w-xs truncate">{log.details}</td>
                  <td className="p-3 text-slate-400 text-[11px]">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE PROGRAM MODAL */}
      {showAddProgram && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Wellness Program</h3>
            <form onSubmit={handleCreateProgram} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Program Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 21-Day Gut Detox"
                  value={programForm.name}
                  onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="7999"
                    value={programForm.price}
                    onChange={(e) => setProgramForm({ ...programForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={programForm.durationDays}
                    onChange={(e) => setProgramForm({ ...programForm, durationDays: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Talking Points</label>
                <textarea
                  rows={2}
                  placeholder="Key value propositions for telecallers..."
                  value={programForm.talkingPoints}
                  onChange={(e) => setProgramForm({ ...programForm, talkingPoints: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProgram(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-wellness-600 hover:bg-wellness-700 shadow-soft"
                >
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Team User</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@wellwith.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="TEAM_MEMBER">Team Member / Telecaller</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                  <option value="CLIENT_ADMIN">Client Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-wellness-600 hover:bg-wellness-700 shadow-soft"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
