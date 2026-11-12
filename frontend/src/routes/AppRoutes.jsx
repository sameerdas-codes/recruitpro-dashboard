import { useLayoutEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Dashboard from "../pages/HRDashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import CreateJob from "../pages/CreateJob";
import EditJob from "../pages/EditJob";
import CandidateDashboard from "../pages/CandidateDashboard";
import CandidateSettings from "../pages/CandidateSettings";
import ApplyJob from "../pages/ApplyJob";
import Profile from "../pages/Profile";
import Interviews from "../pages/Interviews";
import Notifications from "../pages/Notifications";
import InterviewerDashboard from "../pages/InterviewerDashboard";
import Contact from "../pages/Contact";

function RouteScrollReset() {
  const { pathname, hash, key } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      document
        .getElementById(decodeURIComponent(hash.slice(1)))
        ?.scrollIntoView({ block: "start", behavior: "instant" });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, key]);

  return null;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <RouteScrollReset />
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/contact" element={<Contact standalone />} />

        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Register Page */}
        <Route path="/register" element={<Register />} />

        {/* Forgot Password Page */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/reset-password/:uid/:token"
          element={<ResetPassword />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="hr">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-job"
          element={
            <ProtectedRoute role="hr">
              <CreateJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-job/:id"
          element={
            <ProtectedRoute role="hr">
              <EditJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate-dashboard"
          element={
            <ProtectedRoute role="candidate">
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute role="any">
              <CandidateSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/settings"
          element={<Navigate to="/settings" replace />}
        />
        <Route
          path="/interviewer-dashboard"
          element={
            <ProtectedRoute role="interviewer">
              <InterviewerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apply-job/:id"
          element={
            <ProtectedRoute role="candidate">
              <ApplyJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute role="any">
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/profile"
          element={
            <ProtectedRoute role="candidate">
              <Profile profileRole="candidate" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/profile"
          element={
            <ProtectedRoute role="hr">
              <Profile profileRole="hr" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviewer/profile"
          element={
            <ProtectedRoute role="interviewer">
              <Profile profileRole="interviewer" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviews"
          element={
            <ProtectedRoute role="any">
              <Interviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute role="any">
              <Notifications />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
