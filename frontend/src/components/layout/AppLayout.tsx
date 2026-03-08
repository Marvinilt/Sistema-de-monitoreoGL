// Feature: frontend-redesign-futurista
// Requisitos: 3.1, 3.12

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-background-dark overflow-hidden">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Right column: header + content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
