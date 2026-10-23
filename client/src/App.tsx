import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { FocusQueuePage } from './pages/FocusQueuePage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { ConsultationsPage } from './pages/ConsultationsPage';
import { RenewalsPage } from './pages/RenewalsPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { TeamActivityPage } from './pages/TeamActivityPage';
import { AiTelecallingPage } from './pages/AiTelecallingPage';
import { SettingsPage } from './pages/SettingsPage';
import { RefreshCw } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6FBF7] dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-wellness-600" size={32} />
        <p className="text-xs font-semibold text-slate-500">Checking credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="focus" element={<FocusQueuePage />} />
          <Route path="followups" element={<FollowUpsPage />} />
          <Route path="consultations" element={<ConsultationsPage />} />
          <Route path="renewals" element={<RenewalsPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="team" element={<TeamActivityPage />} />
          <Route path="ai-telecalling" element={<AiTelecallingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
