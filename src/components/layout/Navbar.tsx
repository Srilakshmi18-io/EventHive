import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import {
  Ticket,
  Calendar,
  Layers,
  Compass,
  LogOut,
  LogIn,
  Menu,
  X,
  Shield,
  Briefcase,
  Flame,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin, isOrganizer, isAttendee } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#9333EA] flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition">
                <Ticket className="w-5 h-5 -rotate-12" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-[#111827]">
                  Event<span className="text-[#6D28D9]">Hive</span>
                </span>
                <span className="block text-[10px] font-medium tracking-wide uppercase text-gray-500 -mt-1">
                  High-Scale Ticketing
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/events"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive('/events')
                    ? 'text-[#6D28D9] bg-purple-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Explore Events</span>
              </Link>

              {/* Role-specific quick links */}
              {isAuthenticated && (
                <>
                  <Link
                    to="/my-tickets"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      isActive('/my-tickets')
                        ? 'text-[#6D28D9] bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Ticket className="w-4 h-4" />
                    <span>My Tickets</span>
                  </Link>

                  <Link
                    to="/my-orders"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      isActive('/my-orders')
                        ? 'text-[#6D28D9] bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Orders</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Direct Portal Button based on Role */}
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-black transition shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin Console</span>
              </Link>
            )}

            {isOrganizer && (
              <Link
                to="/organizer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-100 text-[#6D28D9] hover:bg-purple-200 transition"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Organizer Dashboard</span>
              </Link>
            )}

            {/* User Profile / Auth State */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <div className="flex items-center gap-2">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-100"
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-900 leading-tight">
                        {user.name}
                      </span>
                      <Badge
                        variant={
                          user.role === 'ADMIN'
                            ? 'danger'
                            : user.role === 'ORGANIZER'
                            ? 'purple'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {user.role}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-gray-500 block truncate max-w-[130px]">
                      {user.email}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium rounded-xl text-white bg-[#6D28D9] hover:bg-[#7C3AED] transition shadow-xs"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Explore Events
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/my-tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                My Tickets
              </Link>
              <Link
                to="/my-orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                My Orders
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-purple-700 font-semibold bg-purple-50"
                >
                  Admin Console
                </Link>
              )}
              {isOrganizer && (
                <Link
                  to="/organizer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-purple-700 font-semibold bg-purple-50"
                >
                  Organizer Dashboard
                </Link>
              )}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">{user?.name} ({user?.role})</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-600 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 text-sm font-medium text-white bg-[#6D28D9] rounded-lg"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
