import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { AdminRoute } from './routes/AdminRoute.jsx';

import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { OnboardingPage } from './pages/OnboardingPage.jsx';
import { DiscoverBuildersPage } from './pages/DiscoverBuildersPage.jsx';
import { DiscoverStartupsPage } from './pages/DiscoverStartupsPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { EditProfilePage } from './pages/EditProfilePage.jsx';
import { BuilderProfilePage } from './pages/BuilderProfilePage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { AnalyticsPage } from './pages/AnalyticsPage.jsx';
import { StartupsPage } from './pages/StartupsPage.jsx';
import { CreateStartupPage } from './pages/CreateStartupPage.jsx';
import { StartupDetailPage } from './pages/StartupDetailPage.jsx';
import { ProjectDetailPage } from './pages/ProjectDetailPage.jsx';
import { ApplicationsPage } from './pages/ApplicationsPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="discover/builders" element={<DiscoverBuildersPage />} />
          <Route path="discover/startups" element={<DiscoverStartupsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/edit" element={<EditProfilePage />} />
          <Route path="builders/:userId" element={<BuilderProfilePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dashboard/analytics" element={<AnalyticsPage />} />
          <Route path="startups" element={<StartupsPage />} />
          <Route path="startups/new" element={<CreateStartupPage />} />
          <Route path="startups/:id" element={<StartupDetailPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="applications" element={<ApplicationsPage />} />

          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>

        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
