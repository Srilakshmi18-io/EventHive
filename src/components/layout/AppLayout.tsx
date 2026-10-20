import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { DevBanner } from '../common/DevBanner';
import { Ticket, Github, Heart } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  const isOrganizerRoute = location.pathname.startsWith('/organizer');
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827]">
      {/* Dev & Diagnostic Observability Banner */}
      <DevBanner />

      {/* Main Navigation Bar */}
      <Navbar />

      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        {isOrganizerRoute ? (
          <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
            <div className="hidden md:block">
              <Sidebar type="ORGANIZER" />
            </div>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        ) : isAdminRoute ? (
          <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
            <div className="hidden md:block">
              <Sidebar type="ADMIN" />
            </div>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        ) : (
          <main className="flex-1">
            <Outlet />
          </main>
        )}
      </div>

      {/* Public Footer */}
      {!isOrganizerRoute && !isAdminRoute && (
        <footer className="bg-white border-t border-[#E5E7EB] mt-16 text-sm text-gray-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#6D28D9] flex items-center justify-center text-white">
                  <Ticket className="w-4 h-4 -rotate-12" />
                </div>
                <div>
                  <span className="font-bold text-gray-900">EventHive</span>
                  <p className="text-xs text-gray-500">Multi-Tenant Event &amp; Ticket Reservation System</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs">
                <a href="/events" className="hover:text-purple-600 transition">
                  Browse Events
                </a>
                <a href="/admin/stress-test" className="hover:text-purple-600 transition">
                  Stress Test Harness
                </a>
              </div>

              <div className="text-xs text-gray-400">
                PostgreSQL SELECT FOR UPDATE &bull; BullMQ Cron &bull; Redis Cache Primitives
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
