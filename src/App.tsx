import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { SystemProvider } from './context/SystemContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { EventsListPage } from './pages/EventsListPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentResultPage } from './pages/PaymentResultPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { MyTicketsPage } from './pages/MyTicketsPage';

// Organizer Pages
import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { OrganizerEventsPage } from './pages/organizer/OrganizerEventsPage';
import { EventEditorPage } from './pages/organizer/EventEditorPage';
import { EventSalesDetailPage } from './pages/organizer/EventSalesDetailPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { StressTestPage } from './pages/admin/StressTestPage';

// Role Guard Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Array<'ADMIN' | 'ORGANIZER' | 'ATTENDEE'>;
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not allowed, redirect to user's home or events
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'ORGANIZER') return <Navigate to="/organizer" replace />;
    return <Navigate to="/events" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SystemProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                {/* Public Routes */}
                <Route index element={<LandingPage />} />
                <Route path="events" element={<EventsListPage />} />
                <Route path="events/:eventId" element={<EventDetailPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />

                {/* Attendee Routes */}
                <Route path="checkout/:reservationId" element={<CheckoutPage />} />
                <Route path="payment-result/:orderId" element={<PaymentResultPage />} />
                <Route
                  path="my-orders"
                  element={
                    <ProtectedRoute>
                      <MyOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="my-tickets"
                  element={
                    <ProtectedRoute>
                      <MyTicketsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Organizer Multi-Tenant Routes */}
                <Route
                  path="organizer"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <OrganizerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="organizer/events"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <OrganizerEventsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="organizer/events/new"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <EventEditorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="organizer/events/edit/:eventId"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <EventEditorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="organizer/events/sales/:eventId"
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <EventSalesDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Platform Routes */}
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/events"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminEventsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/stress-test"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <StressTestPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Fallback */}
                <Route path="*" element={<Navigate to="/events" replace />} />
              </Route>
            </Routes>
          </AuthProvider>
        </SystemProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
