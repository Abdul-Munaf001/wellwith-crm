'use client';

import React, { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import {
  Settings,
  Users,
  Megaphone,
  Tag,
  Package,
  FileCode,
  DollarSign,
  ShieldCheck,
  Download,
  Trash2,
  Send,
  Sparkles,
  Key,
  Copy,
  CheckCircle2,
  Flame,
  Radio,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export const AdminSettings: React.FC = () => {
  const {
    profiles,
    campaigns,
    products,
    activities,
    leads,
    currentUser,
    simulateIncomingMetaLead,
    simulateBolnaCallCompletion,
    simulateWhatsAppReply,
    resetToDemoData,
  } = useCrm();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'users' | 'campaigns' | 'products' | 'adspend' | 'n8n' | 'compliance'
  >('n8n');

  // Ad spend form state
  const [adSpendCampaignId, setAdSpendCampaignId] = useState(campaigns[0]?.id || '');
  const [adSpendDate, setAdSpendDate] = useState(new Date().toISOString().split('T')[0]);
  const [adSpendAmount, setAdSpendAmount] = useState('2500');
  const [adSpendMetaLeads, setAdSpendMetaLeads] = useState('14');
  const [spendAddedSuccess, setSpendAddedSuccess] = useState(false);

  // Webhook sandbox payload response
  const [webhookResponse, setWebhookResponse] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const sharedSecret = 'wellwith_n8n_secret_production_2026';

  const handleCopySecret = () => {
    navigator.clipboard.writeText(sharedSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRecordAdSpend = (e: React.FormEvent) => {
    e.preventDefault();
    const camp = campaigns.find((c) => c.id === adSpendCampaignId);
    if (camp) {
      camp.spend += Number(adSpendAmount);
      camp.meta_leads += Number(adSpendMetaLeads);
    }
    setSpendAddedSuccess(true);
    setTimeout(() => setSpendAddedSuccess(false), 2500);
  };

  const handleExportFullDatabaseJson = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      profiles,
      campaigns,
      products,
      leads,
      activities,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const link = document.createElement('a');
    link.href = jsonStr;
    link.download = `wellwith_crm_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              System Control & Integrations
            </span>
            <span className="text-xs text-slate-500 font-mono">Shared Secret & Webhook Bus Active</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CRM Settings & n8n Workflows</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Configure clinic telecallers, promotional coupon codes, daily Meta ad spend entries, and live automation
            webhooks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetToDemoData}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Reset to Demo Seed Data
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-4 text-xs font-bold no-scrollbar">
        {[
          { id: 'n8n', label: '1. n8n & API Webhooks Simulator', icon: Radio },
          { id: 'adspend', label: '2. Daily Ad Spend Entry', icon: DollarSign },
          { id: 'users', label: '3. Telecallers & Permissions', icon: Users },
          { id: 'campaigns', label: '4. Campaigns & Coupons', icon: Megaphone },
          { id: 'products', label: '5. Product Catalog & Margins', icon: Package },
          { id: 'compliance', label: '6. Compliance, DND & Audit Logs', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as typeof activeAdminTab)}
              className={`pb-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeAdminTab === tab.id
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: N8N AUTOMATION & WEBHOOKS */}
      {activeAdminTab === 'n8n' && (
        <div className="space-y-6">
          {/* Secret & Credentials Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                  Authentication Secret
                </span>
                <h3 className="text-lg font-bold">n8n / Next.js Webhook Secret Header</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Protect endpoints with the HTTP Header: <code className="text-emerald-300">x-webhook-secret</code>
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-700 px-3 py-2 rounded-xl">
                <code className="text-xs font-mono text-emerald-300">{sharedSecret}</code>
                <button
                  onClick={handleCopySecret}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  title="Copy secret"
                >
                  {copiedKey ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-700 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Endpoint 1: Meta Lead Intake</div>
                <code className="text-[11px] text-emerald-300 font-mono block mt-1">/api/webhooks/meta-lead</code>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Endpoint 2: Bolna AI Call Webhook</div>
                <code className="text-[11px] text-emerald-300 font-mono block mt-1">/api/webhooks/bolna-call</code>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Endpoint 3: WhatsApp Status & STOP</div>
                <code className="text-[11px] text-emerald-300 font-mono block mt-1">/api/webhooks/whatsapp-status</code>
              </div>
            </div>
          </div>

          {/* Interactive Webhook Simulator Buttons */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Interactive Webhook Testing Suite
            </h3>
            <p className="text-xs text-slate-500">
              Click any workflow button below to fire realistic incoming payloads through the CRM business logic.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Trigger 1: Meta Lead */}
              <div className="border border-slate-200 rounded-2xl p-4 hover:border-emerald-300 transition-colors flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>Workflow 1: New Meta Lead</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Cleans phone (+91), deduplicates against existing records, assigns Hot score, and begins 90s SLA
                    countdown.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const l = simulateIncomingMetaLead('hot');
                    setWebhookResponse(`[200 OK] Lead created: ${l.name} (${l.phone_clean}) - Hot Queue alerted.`);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Fire Meta Lead Webhook
                </button>
              </div>

              {/* Trigger 2: Bolna Call Result */}
              <div className="border border-slate-200 rounded-2xl p-4 hover:border-emerald-300 transition-colors flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    <span>Workflow 2: Bolna Call Handler</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Bolna returns call duration, recording URL, AI transcript, and confirms interested status.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (leads[0]) {
                      simulateBolnaCallCompletion(leads[0].id);
                      setWebhookResponse(`[200 OK] Bolna AI Call log recorded for ${leads[0].name} (84s duration).`);
                    }
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Fire Bolna Call Webhook
                </button>
              </div>

              {/* Trigger 3: WhatsApp STOP DND */}
              <div className="border border-slate-200 rounded-2xl p-4 hover:border-emerald-300 transition-colors flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="text-base">🚫</span>
                    <span>Workflow 4: WhatsApp "STOP"</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Customer texts "STOP". Trigger auto-enables DND = true and blocks marketing messages per compliance.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (leads[0]) {
                      simulateWhatsAppReply(leads[0].id, 'STOP');
                      setWebhookResponse(`[200 OK] "STOP" received for ${leads[0].name}. DND set to TRUE.`);
                    }
                  }}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl text-xs transition-colors"
                >
                  Simulate WhatsApp STOP
                </button>
              </div>
            </div>

            {webhookResponse && (
              <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 flex items-center justify-between">
                <span>{webhookResponse}</span>
                <button
                  onClick={() => setWebhookResponse(null)}
                  className="text-slate-400 hover:text-white font-sans text-[11px]"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AD SPEND ENTRY FORM */}
      {activeAdminTab === 'adspend' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-2xl space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Daily Meta Ad Spend Entry Form
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Input daily Meta ad expenditure to calculate live Cost Per Order (CPO) and campaign unit economics.
            </p>
          </div>

          {spendAddedSuccess && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold">
              ✓ Ad Spend updated! Cost per Order (CPO) recalculated on Executive Dashboard.
            </div>
          )}

          <form onSubmit={handleRecordAdSpend} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Select Active Campaign
              </label>
              <select
                value={adSpendCampaignId}
                onChange={(e) => setAdSpendCampaignId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.source})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Spend Date
                </label>
                <input
                  type="date"
                  value={adSpendDate}
                  onChange={(e) => setAdSpendDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Spend Amount (₹)
                </label>
                <input
                  type="number"
                  value={adSpendAmount}
                  onChange={(e) => setAdSpendAmount(e.target.value)}
                  required
                  placeholder="2500"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Meta Leads Generated
                </label>
                <input
                  type="number"
                  value={adSpendMetaLeads}
                  onChange={(e) => setAdSpendMetaLeads(e.target.value)}
                  required
                  placeholder="14"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
            >
              Record Daily Ad Spend & Recalculate CPO
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: USERS & ROLES */}
      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Staff User Profiles & Role Matrix
            </h3>
            <p className="text-[11px] text-slate-400">
              Configured per Step 3: Owner, Manager, Closer (Store staff), Viewer
            </p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Permissions Scope</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-base">{p.avatar}</span>
                    <span>{p.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{p.phone}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {p.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {p.role === 'owner' && 'Full system, settings, revenue, compliance deletion'}
                    {p.role === 'manager' && 'View all leads, reassign, CSV exports'}
                    {p.role === 'closer' && 'Assigned leads + Hot queue, POS order entry. No delete/export.'}
                    {p.role === 'viewer' && 'Read-only analytics and cohort reporting'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: CAMPAIGNS & COUPONS */}
      {activeAdminTab === 'campaigns' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Marketing Campaigns & Offline Attribution Coupons
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Source Channel</th>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Total Ad Spend</th>
                <th className="py-3 px-4">Meta Inbound Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4 text-slate-600">{c.source}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                    <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {c.coupon_code || 'NONE'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{formatINR(c.spend)}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.meta_leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: PRODUCTS */}
      {activeAdminTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Ayurvedic Product Catalog & Gross Margins
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Formulation Name</th>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">MRP Price</th>
                <th className="py-3 px-4">Product Gross Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{p.sku}</td>
                  <td className="py-3 px-4 text-slate-600">{p.category}</td>
                  <td className="py-3 px-4 font-black text-slate-900">{formatINR(p.price)}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">{p.margin}% Gross Margin</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: COMPLIANCE, DND & AUDIT TRAIL */}
      {activeAdminTab === 'compliance' && (
        <div className="space-y-6">
          {/* Owner Compliance Export & Deletion */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                TRAI & Personal Data Compliance (Owner Controls)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute encrypted customer data export or trigger audit backups.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportFullDatabaseJson}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Full DB JSON</span>
              </button>
            </div>
          </div>

          {/* Audit Log Activities */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Full Audit Trail (`activities` Log)
              </h3>
              <p className="text-[11px] text-slate-400">
                Immutable chronological log of stage transitions, telecaller assignments, and doctor approvals
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Action Type</th>
                    <th className="py-3 px-4">Audit Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(act.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{act.user_name || 'System Auto'}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {act.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{act.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
