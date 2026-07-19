import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/auth';
import { AdminAuthProvider, useAdminAuth } from './store/adminAuth';
import { startSyncEngine } from './lib/sync';

// Field User screens
import SplashScreen from './pages/SplashScreen';
import WelcomeScreen from './pages/WelcomeScreen';
import RegisterScreen from './pages/RegisterScreen';
import LoginScreen from './pages/LoginScreen';
import AddToHomeScreen from './pages/AddToHomeScreen';
import TutorialScreen from './pages/TutorialScreen';
import HomeScreen from './pages/HomeScreen';
import ProjectDetailScreen from './pages/ProjectDetailScreen';
import ProjectBriefingScreen from './pages/ProjectBriefingScreen';
import QuestionnaireScreen from './pages/QuestionnaireScreen';
import AchievementsScreen from './pages/AchievementsScreen';
import SuggestionsScreen from './pages/SuggestionsScreen';
import HelpScreen from './pages/HelpScreen';
import ProfileScreen from './pages/ProfileScreen';
import BrowseProjectsScreen from './pages/BrowseProjectsScreen';
import LeaderboardScreen from './pages/LeaderboardScreen';
import AnnouncementsScreen from './pages/AnnouncementsScreen';

// Admin screens
import AdminLoginScreen from './pages/admin/AdminLoginScreen';
import AdminLayout from './pages/admin/AdminLayout';
import AdminHome from './pages/admin/AdminHome';
import AdminProjects from './pages/admin/AdminProjects';
import AdminProjectDetail from './pages/admin/AdminProjectDetail';
import AdminProjectForm from './pages/admin/AdminProjectForm';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAdmins from './pages/admin/AdminAdmins';
import AdminSuggestions from './pages/admin/AdminSuggestions';
import AdminBroadcasts from './pages/admin/AdminBroadcasts';

import OfflineBanner from './components/OfflineBanner';
import LoadingScreen from './components/LoadingScreen';

function FieldApp() {
  const { user, loading } = useAuth();

  useEffect(() => {
    startSyncEngine();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/welcome" element={!user ? <WelcomeScreen /> : <Navigate to="/home" />} />
        <Route path="/register" element={!user ? <RegisterScreen /> : <Navigate to="/home" />} />
        <Route path="/login" element={!user ? <LoginScreen /> : <Navigate to="/home" />} />
        <Route path="/add-to-home" element={user ? <AddToHomeScreen /> : <Navigate to="/welcome" />} />
        <Route path="/tutorial" element={user ? <TutorialScreen /> : <Navigate to="/welcome" />} />
        <Route path="/home" element={user ? <HomeScreen /> : <Navigate to="/welcome" />} />
        <Route path="/projects" element={user ? <HomeScreen tab="projects" /> : <Navigate to="/welcome" />} />
        <Route path="/projects/browse" element={user ? <BrowseProjectsScreen /> : <Navigate to="/welcome" />} />
        <Route path="/projects/:id" element={user ? <ProjectDetailScreen /> : <Navigate to="/welcome" />} />
        <Route path="/projects/:id/briefing" element={user ? <ProjectBriefingScreen /> : <Navigate to="/welcome" />} />
        <Route path="/projects/:id/submit" element={user ? <QuestionnaireScreen /> : <Navigate to="/welcome" />} />
        <Route path="/achievements" element={user ? <AchievementsScreen /> : <Navigate to="/welcome" />} />
        <Route path="/suggestions" element={user ? <SuggestionsScreen /> : <Navigate to="/welcome" />} />
        <Route path="/help" element={user ? <HelpScreen /> : <Navigate to="/welcome" />} />
        <Route path="/profile" element={user ? <ProfileScreen /> : <Navigate to="/welcome" />} />
        <Route path="/leaderboard" element={user ? <LeaderboardScreen /> : <Navigate to="/welcome" />} />
        <Route path="/announcements" element={user ? <AnnouncementsScreen /> : <Navigate to="/welcome" />} />
      </Routes>
    </>
  );
}

function AdminApp() {
  const { admin, loading } = useAdminAuth();
  if (loading) return <LoadingScreen />;
  return (
    <Routes>
      <Route path="login" element={!admin ? <AdminLoginScreen /> : <Navigate to="/admin" />} />
      <Route path="/" element={admin ? <AdminLayout /> : <Navigate to="/admin/login" />}>
        <Route index element={<AdminHome />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="projects/new" element={<AdminProjectForm />} />
        <Route path="projects/:id" element={<AdminProjectDetail />} />
        <Route path="projects/:id/edit" element={<AdminProjectForm />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="admins" element={<AdminAdmins />} />
        <Route path="suggestions" element={<AdminSuggestions />} />
        <Route path="broadcasts" element={<AdminBroadcasts />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/*" element={<FieldApp />} />
        </Routes>
      </AdminAuthProvider>
    </AuthProvider>
  );
}
