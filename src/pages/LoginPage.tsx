import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Ticket,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Briefcase,
  UserCheck,
  Check,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, demoAccounts } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo-password');
  const [isLoading, setIsLoading] = useState(false);

  // Read redirect destination if available
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast('Please enter your account email address.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const loggedUser = await login(email);
      toast(`Welcome back, ${loggedUser.name}!`, 'success');
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin');
      } else if (loggedUser.role === 'ORGANIZER') {
        navigate('/organizer');
      } else {
        navigate(from === '/login' ? '/events' : from);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLoginClick = (userId: string) => {
    quickLogin(userId);
    const target = demoAccounts.find((u) => u.id === userId);
    if (target) {
      toast(`Signed in as ${target.name} (${target.role})`, 'success');
      if (target.role === 'ADMIN') {
        navigate('/admin');
      } else if (target.role === 'ORGANIZER') {
        navigate('/organizer');
      } else {
        navigate('/events');
      }
    }
  };

  // Group demo accounts by role
  const adminAccount = demoAccounts.find((u) => u.role === 'ADMIN');
  const organizerAccounts = demoAccounts.filter((u) => u.role === 'ORGANIZER');
  const attendeeAccounts = demoAccounts.filter((u) => u.role === 'ATTENDEE');

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center space-y-2 mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-100 text-[#6D28D9] mb-2 shadow-xs">
          <Ticket className="w-6 h-6 -rotate-12" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Sign In to EventHive
        </h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Choose a pre-seeded demo role for instant one-click access or enter your registered account credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: One-Click Quick Login Buttons */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>One-Click Quick Login</span>
            </h2>
            <span className="text-[11px] text-gray-400">Pre-seeded accounts</span>
          </div>

          {/* Admin Account */}
          {adminAccount && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-rose-600" /> Platform Administrator
              </span>
              <button
                type="button"
                onClick={() => handleQuickLoginClick(adminAccount.id)}
                className="w-full text-left p-3 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-300 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={adminAccount.avatar}
                    alt={adminAccount.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-200"
                  />
                  <div>
                    <div className="text-sm font-bold text-gray-900 group-hover:text-rose-700">
                      {adminAccount.name}
                    </div>
                    <div className="text-xs text-gray-500">{adminAccount.email}</div>
                  </div>
                </div>
                <Badge variant="danger" size="sm">
                  ADMIN
                </Badge>
              </button>
            </div>
          )}

          {/* Organizers */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-purple-600" /> Event Organizers (Multi-Tenant)
            </span>
            <div className="grid grid-cols-1 gap-2">
              {organizerAccounts.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleQuickLoginClick(org.id)}
                  className="w-full text-left p-3 rounded-xl border border-purple-200 bg-purple-50/30 hover:bg-purple-50 hover:border-purple-300 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={org.avatar}
                      alt={org.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-200"
                    />
                    <div>
                      <div className="text-sm font-bold text-gray-900 group-hover:text-[#6D28D9]">
                        {org.organizationName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {org.name} &bull; {org.email}
                      </div>
                    </div>
                  </div>
                  <Badge variant="purple" size="sm">
                    ORGANIZER
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Attendees (Ticket Buyers)
            </span>
            <div className="grid grid-cols-1 gap-2">
              {attendeeAccounts.map((att) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => handleQuickLoginClick(att.id)}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white hover:border-gray-300 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={att.avatar}
                      alt={att.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-200"
                    />
                    <div>
                      <div className="text-sm font-bold text-gray-900 group-hover:text-[#6D28D9]">
                        {att.name}
                      </div>
                      <div className="text-xs text-gray-500">{att.email}</div>
                    </div>
                  </div>
                  <Badge variant="neutral" size="sm">
                    ATTENDEE
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Standard Email Sign-In */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
              Manual Sign In
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter any existing user email from the system.
            </p>
          </div>

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex.rivera@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                Any password is accepted for mock verification.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In with Email
            </Button>
          </form>

          <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
            Don&apos;t have an account yet?{' '}
            <Link to="/register" className="font-semibold text-[#6D28D9] hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
