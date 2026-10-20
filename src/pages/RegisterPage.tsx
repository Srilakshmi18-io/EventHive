import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Role } from '../types';
import {
  UserCheck,
  Briefcase,
  Mail,
  User,
  Building,
  Lock,
  ArrowRight,
  Ticket,
  Check,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>('ATTENDEE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast('Please complete all required fields.', 'warning');
      return;
    }

    if (role === 'ORGANIZER' && !organizationName.trim()) {
      toast('Please provide your organization or company name.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await register({
        name: name.trim(),
        email: email.trim(),
        role,
        organizationName: role === 'ORGANIZER' ? organizationName.trim() : undefined,
      });

      toast(`Account created! Welcome to EventHive, ${newUser.name}.`, 'success');
      if (newUser.role === 'ORGANIZER') {
        navigate('/organizer');
      } else {
        navigate('/events');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-100 text-[#6D28D9] mb-2 shadow-xs">
          <Ticket className="w-6 h-6 -rotate-12" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Create an EventHive Account
        </h1>
        <p className="text-sm text-gray-500">
          Select your account type to begin buying tickets or managing multi-tier events.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs">
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole('ATTENDEE')}
            className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
              role === 'ATTENDEE'
                ? 'border-[#6D28D9] bg-purple-50/50 shadow-xs'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                role === 'ATTENDEE'
                  ? 'bg-[#6D28D9] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-gray-900 block">Attendee</span>
              <span className="text-xs text-gray-500">Reserve tickets &amp; attend events</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole('ORGANIZER')}
            className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
              role === 'ORGANIZER'
                ? 'border-[#6D28D9] bg-purple-50/50 shadow-xs'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                role === 'ORGANIZER'
                  ? 'bg-[#6D28D9] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-gray-900 block">Organizer</span>
              <span className="text-xs text-gray-500">Host, tier &amp; sell tickets</span>
            </div>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Hayes"
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
              />
            </div>
          </div>

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
                placeholder="e.g. jordan@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
              />
            </div>
          </div>

          {role === 'ORGANIZER' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Organization / Company Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Apex Live Productions"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </div>
        </form>

        <div className="pt-5 border-t border-gray-100 text-center text-xs text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#6D28D9] hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
