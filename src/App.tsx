import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AppUser } from './types';
import { LoadingProvider } from './context/LoadingContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// User (Citizen) Pages
import UserDashboard from './pages/UserDashboard';
import UserReport from './pages/UserReport';
import UserHistory from './pages/UserHistory';

// Inspector Pages
import InspectorDashboard from './pages/InspectorDashboard';
import InspectorReportDetail from './pages/InspectorReportDetail';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminReports from './pages/AdminReports';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSources from './pages/AdminSources';
import AdminInspectors from './pages/AdminInspectors';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("safeuz_token");
      const storedUser = localStorage.getItem("safeuz_user");

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          setUserProfile(parsedUser);

          // Verify with backend to get fresh profile data
          const response = await fetch("/api/users/profile", {
            headers: {
              "Authorization": `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setCurrentUser(data.user);
              setUserProfile(data.user);
              localStorage.setItem("safeuz_user", JSON.stringify(data.user));
            }
          } else {
            // Token invalid or expired
            console.warn("Session token is invalid or expired, logging out.");
            localStorage.removeItem("safeuz_token");
            localStorage.removeItem("safeuz_user");
            setCurrentUser(null);
            setUserProfile(null);
          }
        } catch (err) {
          console.error("Auth verification failed:", err);
          localStorage.removeItem("safeuz_token");
          localStorage.removeItem("safeuz_user");
          setCurrentUser(null);
          setUserProfile(null);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#060813] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Sizning sessiyangiz tekshirilmoqda...</span>
        </div>
      </div>
    );
  }

  // Routing Auth guards
  const RequireAuthGuard = ({ children, allowedRoles }: { children: any, allowedRoles?: string[] }) => {
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles) {
      // Allow if matches role or profile is loading (fallback standard redirect)
      if (userProfile && !allowedRoles.includes(userProfile.role)) {
        // Misaligned role, route to their designated root
        if (userProfile.role === "admin") return <Navigate to="/admin/dashboard" replace />;
        if (userProfile.role === "inspector") return <Navigate to="/inspector/dashboard" replace />;
        return <Navigate to="/user/dashboard" replace />;
      }
    }

    return children;
  };

  return (
    <LoadingProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={currentUser ? (
            userProfile?.role === "admin" ? <Navigate to="/admin/dashboard" replace /> :
            userProfile?.role === "inspector" ? <Navigate to="/inspector/dashboard" replace /> :
            <Navigate to="/user/dashboard" replace />
          ) : <LoginPage />} />
          <Route path="/register" element={currentUser ? <Navigate to="/user/dashboard" replace /> : <RegisterPage />} />

          {/* Citizen (User) Routes */}
          <Route path="/user/dashboard" element={
            <RequireAuthGuard allowedRoles={["user", "admin"]}>
              <UserDashboard />
            </RequireAuthGuard>
          } />
          <Route path="/user/report" element={
            <RequireAuthGuard allowedRoles={["user", "admin"]}>
              <UserReport />
            </RequireAuthGuard>
          } />
          <Route path="/user/history" element={
            <RequireAuthGuard allowedRoles={["user", "admin"]}>
              <UserHistory />
            </RequireAuthGuard>
          } />

          {/* Inspector (Narcotics officer) Routes */}
          <Route path="/inspector/dashboard" element={
            <RequireAuthGuard allowedRoles={["inspector", "admin"]}>
              <InspectorDashboard />
            </RequireAuthGuard>
          } />
          <Route path="/inspector/reports" element={
            <RequireAuthGuard allowedRoles={["inspector", "admin"]}>
              <InspectorDashboard />
            </RequireAuthGuard>
          } />
          <Route path="/inspector/report/:id" element={
            <RequireAuthGuard allowedRoles={["inspector", "admin"]}>
              <InspectorReportDetail />
            </RequireAuthGuard>
          } />

          {/* System Admin Routes */}
          <Route path="/admin/dashboard" element={
            <RequireAuthGuard allowedRoles={["admin"]}>
              <AdminDashboard />
            </RequireAuthGuard>
          } />
          <Route path="/admin/reports" element={
            <RequireAuthGuard allowedRoles={["admin"]}>
              <AdminReports />
            </RequireAuthGuard>
          } />
          <Route path="/admin/analytics" element={
            <RequireAuthGuard allowedRoles={["admin"]}>
              <AdminAnalytics />
            </RequireAuthGuard>
          } />
          <Route path="/admin/sources" element={
            <RequireAuthGuard allowedRoles={["admin"]}>
              <AdminSources />
            </RequireAuthGuard>
          } />
          <Route path="/admin/inspectors" element={
            <RequireAuthGuard allowedRoles={["admin"]}>
              <AdminInspectors />
            </RequireAuthGuard>
          } />
          <Route path="/admin/users" element={
            <RequireAuthGuard allowedRoles={["admin"]}>
              <AdminUsers />
            </RequireAuthGuard>
          } />
          <Route path="/admin/settings" element={
            <RequireAuthGuard allowedRoles={["admin"]}>
              <AdminSettings />
            </RequireAuthGuard>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LoadingProvider>
  );
}
