'use client';

import React, { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Lead } from '@/types/crm';
import { Navbar } from '@/components/Navbar';
import { HotQueue } from '@/components/HotQueue';
import { KanbanBoard } from '@/components/KanbanBoard';
import { LeadsList } from '@/components/LeadsList';
import { FollowUpsView } from '@/components/FollowUpsView';
import { DashboardView } from '@/components/DashboardView';
import { AdminSettings } from '@/components/AdminSettings';
import { LeadDetailModal } from '@/components/LeadDetailModal';
import { OrderEntryModal } from '@/components/OrderEntryModal';
import { NewLeadModal } from '@/components/NewLeadModal';
import {
  Flame,
  Kanban,
  Users,
  ShoppingCart,
  Clock,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  const { currentUser, leads } = useCrm();

  const [activeTab, setActiveTab] = useState<string>('hot-queue');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderLead, setOrderLead] = useState<Lead | null>(null);
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);

  const handleOpenOrder = (lead?: Lead) => {
    setOrderLead(lead || null);
    setOrderModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 font-sans">
      {/* Top Green & White Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewLead={() => setNewLeadModalOpen(true)}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Render Tab Views */}
        {activeTab === 'hot-queue' && (
          <HotQueue onSelectLead={setSelectedLead} onOpenOrder={handleOpenOrder} />
        )}

        {activeTab === 'pipeline' && (
          <KanbanBoard onSelectLead={setSelectedLead} onOpenOrder={handleOpenOrder} />
        )}

        {activeTab === 'leads' && (
          <LeadsList onSelectLead={setSelectedLead} onOpenOrder={handleOpenOrder} />
        )}

        {activeTab === 'pos' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Store POS Terminal
                </span>
                <h1 className="text-2xl font-black text-slate-900 mt-1">
                  Retail Counter & Telecaller Order Attribution
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Launch the counter order form to log walk-in orders with HYD10/WA10 coupons and trigger 25-day
                  reorders.
                </p>
              </div>
              <button
                onClick={() => handleOpenOrder()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Open Counter POS Terminal</span>
              </button>
            </div>
            {/* Also show leads list with quick order buttons */}
            <LeadsList onSelectLead={setSelectedLead} onOpenOrder={handleOpenOrder} />
          </div>
        )}

        {activeTab === 'follow-ups' && (
          <FollowUpsView onSelectLead={setSelectedLead} onOpenOrder={handleOpenOrder} />
        )}

        {activeTab === 'dashboard' && <DashboardView />}

        {activeTab === 'admin' && <AdminSettings />}
      </main>

      {/* Modals & Slide-outs */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onOpenOrder={handleOpenOrder}
      />

      <OrderEntryModal
        isOpen={orderModalOpen}
        initialLead={orderLead}
        onClose={() => {
          setOrderModalOpen(false);
          setOrderLead(null);
        }}
      />

      <NewLeadModal
        isOpen={newLeadModalOpen}
        onClose={() => setNewLeadModalOpen(false)}
      />

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            Wellwith CRM • Single Source of Truth for Ayurvedic Clinics & Sales
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-700 font-bold">🟢 Supabase Realtime Socket: Connected</span>
            <span className="text-slate-500">n8n Gateway: Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
