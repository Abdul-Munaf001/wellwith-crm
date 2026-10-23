import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { LeadDetailModal } from './LeadDetailModal';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F6FBF7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Navbar
        collapsed={collapsed}
        onOpenLeadDetail={(id) => setSelectedLeadId(id)}
      />

      <main
        className={`transition-all duration-300 ease-in-out pt-20 px-4 sm:px-8 pb-12 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet context={{ onOpenLeadDetail: (id: string) => setSelectedLeadId(id) }} />
        </div>
      </main>

      {/* Global Lead Detail Modal / Drawer */}
      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onUpdated={() => {
            // Trigger refresh if needed
          }}
        />
      )}
    </div>
  );
};
