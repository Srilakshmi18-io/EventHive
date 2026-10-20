import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  BarChart3,
  Users,
  ShieldAlert,
  Flame,
  ArrowLeft,
  Briefcase,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  type: 'ORGANIZER' | 'ADMIN';
}

export const Sidebar: React.FC<SidebarProps> = ({ type }) => {
  const { user } = useAuth();

  const organizerLinks = [
    { to: '/organizer', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/organizer/events', icon: Calendar, label: 'My Events', end: false },
    { to: '/organizer/events/new', icon: PlusCircle, label: 'Create Event', end: false },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Platform Dashboard', end: true },
    { to: '/admin/events', icon: Calendar, label: 'All Events', end: false },
    { to: '/admin/users', icon: Users, label: 'Users & Approvals', end: false },
    { to: '/admin/stress-test', icon: Flame, label: 'Stress Test (100 Concurrency)', end: false },
  ];

  const links = type === 'ADMIN' ? adminLinks : organizerLinks;

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Context Header */}
        <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            {type === 'ADMIN' ? (
              <Shield className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <Briefcase className="w-3.5 h-3.5 text-purple-600" />
            )}
            <span>{type === 'ADMIN' ? 'Platform Admin' : 'Organizer Workspace'}</span>
          </div>
          <div className="text-sm font-bold text-gray-900 truncate">
            {type === 'ADMIN' ? 'Sarah Connor (Admin)' : user?.organizationName || user?.name}
          </div>
          {type === 'ORGANIZER' && (
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Status: Approved
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-purple-50 text-[#6D28D9] font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer link to Public Store */}
      <div className="pt-4 border-t border-gray-100">
        <NavLink
          to="/events"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Events</span>
        </NavLink>
      </div>
    </aside>
  );
};
