// Feature: frontend-redesign-futurista
// Requisitos: 4.1, 4.2, 4.3, 4.4

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Dashboard } from '../views/Dashboard';
import { ServersView } from '../views/ServersView';
import { SettingsView } from '../views/SettingsView';
import { LogsView } from '../views/LogsView';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/servers" element={<ServersView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/logs" element={<LogsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
