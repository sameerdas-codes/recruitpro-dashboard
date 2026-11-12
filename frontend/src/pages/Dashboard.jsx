import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { downloadResume } from "../services/api";
import { toast } from "react-toastify";
import NotificationBell from "../components/NotificationBell";
import useNotifications from "../hooks/useNotifications";
import "../styles/Dashboard.css";

import {
  FaHome,
  FaBriefcase,
  FaFileAlt,
  FaCalendarAlt,
  FaBell,
  FaUser,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteJobId, setDeleteJobId] = useState(null);

  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  // ================= Fetch Current User =================

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get("/accounts/me/");
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching user:", error);

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      navigate("/login");
      return null;
    }
  }, [navigate]);

  // ================= Fetch HR Jobs =================

  const fetchJobs = useCallback(async (currentUser) => {
    try {
      if (!currentUser) {
        setJobs([]);
        return;
      }

      const response = await api.get("/jobs/");
      const visibleJobs =
        ["hr", "admin"].includes(currentUser.role)
          ? response.data.filter(
              (job) => String(job.created_by) === String(currentUser.id),
            )
          : response.data;
      setJobs(visibleJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    }
  }, []);

  // ================= Fetch Applications =================

  const fetchApplications = useCallback(async () => {
    try {
      const response = await api.get("/applications/");

      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    }
  }, []);

  const fetchInterviews = useCallback(async () => {
    try {
      const response = await api.get("/interviews/");
      setInterviews(response.data);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      toast.error("Failed to load interviews");
    }
  }, []);

  const handleResumeDownload = async (applicationId) => {
    try {
      await downloadResume(applicationId);
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast.error("Failed to download resume");
    }
  };

  // ================= Delete Modal =================

  const openDeleteModal = (id) => {
    setDeleteJobId(id);
  };

  const closeDeleteModal = () => {
    setDeleteJobId(null);
  };

  // ================= Delete Job =================

  const confirmDelete = async () => {
    try {
      const deletedApplicationIds = new Set(
        applications
          .filter((application) => String(application.job) === String(deleteJobId))
          .map((application) => String(application.id)),
      );

      await api.delete(`/jobs/${deleteJobId}/`);

      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== deleteJobId));
      setApplications((prevApplications) =>
        prevApplications.filter(
          (application) => String(application.job) !== String(deleteJobId),
        ),
      );
      setInterviews((prevInterviews) =>
        prevInterviews.filter(
          (interview) =>
            !deletedApplicationIds.has(String(interview.application)),
        ),
      );

      toast.success("Job and its applications deleted successfully!");

      setDeleteJobId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete job");
    }
  };

  // ================= Fetch Everything =================

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const currentUser = await fetchCurrentUser();
      await Promise.all([
        fetchJobs(currentUser),
        fetchApplications(),
        fetchInterviews(),
      ]);

      setLoading(false);
    };

    loadDashboard();
  }, [fetchApplications, fetchCurrentUser, fetchInterviews, fetchJobs]);

  // ================= Logout =================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    toast.success("Logged out successfully");

    navigate("/login");
  };

  // ================= Loading =================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <h1 className="text-xl">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="dashboard-shell min-h-screen bg-slate-900 text-white flex">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <div className="dashboard-sidebar fixed left-0 top-0 h-screen w-64 bg-slate-800 border-r border-slate-700 flex flex-col z-50">
        {/* Logo */}

        <div className="p-6 border-b border-slate-700">
          <h1 className="text-3xl font-bold text-green-400">RecruitPro</h1>
        </div>

        {/* Sidebar Menu */}

        <div className="p-5 space-y-3">
          {/* Dashboard */}

          <button
            onClick={() =>
              document
                .getElementById("your-jobs")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="flex items-center gap-3 w-full bg-slate-700 p-3 rounded-lg transition"
          >
            <FaHome />
            Dashboard
          </button>

          {/* Jobs */}

          <button
            onClick={() =>
              document
                .getElementById("your-jobs")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="flex items-center gap-3 w-full hover:bg-slate-700 p-3 rounded-lg transition"
          >
            <FaBriefcase />
            Jobs
          </button>

          {/* Applicants */}

          <button
            onClick={() =>
              document
                .getElementById("applicants")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="flex items-center gap-3 w-full hover:bg-slate-700 p-3 rounded-lg transition"
          >
            <FaFileAlt />
            Applicants
          </button>

          {/* Interviews */}

          <button
            onClick={() => navigate("/interviews")}
            className="flex items-center gap-3 w-full hover:bg-slate-700 p-3 rounded-lg transition"
          >
            <FaCalendarAlt />
            Interviews
          </button>

          {/* Notifications */}

          <button
            onClick={() => navigate("/notifications")}
            className="flex items-center gap-3 w-full hover:bg-slate-700 p-3 rounded-lg transition"
          >
            <FaBell />
            Notifications ({unreadCount})
          </button>

          {/* Profile */}

          <button
            onClick={() => navigate("/hr/profile")}
            className="flex items-center gap-3 w-full hover:bg-slate-700 p-3 rounded-lg transition"
          >
            <FaUser />
            Profile
          </button>

          {/* Settings */}

          <button
            type="button"
            disabled
            title="Settings are not available yet"
            className="flex items-center gap-3 w-full p-3 rounded-lg opacity-50 cursor-not-allowed"
          >
            <FaCog />
            Settings (coming soon)
          </button>
        </div>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="dashboard-content ml-64 flex-1 flex flex-col">
        {/* =================================================
            TOP NAVBAR
        ================================================= */}

        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 sticky top-0 z-40">
          {/* Left Side */}

          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">HR Dashboard</h2>
          </div>

          {/* Right Side */}

          <div className="flex items-center gap-5">
            {/* Notification */}

            <NotificationBell />

            {/* User */}

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center">
                <FaUser />
              </div>

              <span className="text-sm">
                {user?.first_name || user?.username || "HR"}
              </span>
            </div>

            {/* Logout */}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="p-8">
          {/* Welcome */}

          <div className="mb-8">
            <h1 className="text-4xl font-bold">Welcome to RecruitPro 🚀</h1>

            {user && (
              <p className="text-gray-400 mt-2">
                Welcome back, {user.username}!
              </p>
            )}
          </div>

          {/* Create Job Button */}

          <div className="mb-8">
            <button
              onClick={() => navigate("/create-job")}
              className="bg-green-500 px-5 py-2 rounded-lg hover:bg-green-600 transition font-semibold"
            >
              + Create Job
            </button>
          </div>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Jobs */}

            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
              <h2 className="text-gray-400">Total Jobs</h2>

              <p className="text-3xl font-bold text-green-400 mt-2">
                {jobs.length}
              </p>
            </div>

            {/* Applications */}

            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
              <h2 className="text-gray-400">Applications</h2>

              <p className="text-3xl font-bold text-blue-400 mt-2">
                {applications.length}
              </p>
            </div>

            {/* Interviews */}

            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
              <h2 className="text-gray-400">Interviews</h2>

              <p className="text-3xl font-bold text-purple-400 mt-2">
                {interviews.length}
              </p>
              <button
                type="button"
                onClick={() => navigate("/interviews")}
                className="text-sm text-purple-400 mt-2 hover:text-purple-300"
              >
                Manage interviews
              </button>
            </div>
          </div>

          {/* =================================================
              PROFILE
          ================================================= */}

          {/* Profile Summary + Recent Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
            {/* Left Side */}

            <section className="xl:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Interview schedule</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Keep upcoming conversations moving.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/interviews")}
                  className="text-sm text-green-400 hover:text-green-300"
                >
                  View all
                </button>
              </div>
              {interviews.length === 0 ? (
                <p className="text-gray-400 mt-8">
                  No interviews scheduled yet. Schedule one when an application
                  is ready.
                </p>
              ) : (
                <div className="mt-5 divide-y divide-slate-700">
                  {interviews.slice(0, 4).map((interview) => (
                    <div
                      key={interview.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-wrap justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold">{interview.job_title}</p>
                        <p className="text-sm text-gray-400">
                          {interview.candidate_username} ·{" "}
                          {interview.interviewer_username}
                        </p>
                      </div>
                      <div className="text-sm text-right">
                        <p>{new Date(interview.scheduled_at).toLocaleString()}</p>
                        <p className="text-gray-400">{interview.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Right Side */}
            <div className="space-y-6">
              {/* Profile Summary */}
              {user && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-xl">
                      <FaUser />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">Profile Summary</h2>

                      <p className="text-gray-400 text-sm">
                        Your account information
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm">Username</p>
                      <p className="font-semibold mt-1">{user.username}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-sm">Email</p>
                      <p className="font-semibold mt-1 break-all">
                        {user.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-sm">Role</p>
                      <p className="font-semibold mt-1 text-green-400">
                        {user.role}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/hr/profile")}
                    className="w-full mt-6 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold transition"
                  >
                    View Profile
                  </button>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <FaBell className="text-purple-400" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">Recent Activity</h2>

                    <p className="text-gray-400 text-sm">
                      Latest activity on your account
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-l-2 border-green-400 pl-4">
                    <p className="font-semibold">Jobs Posted</p>

                    <p className="text-gray-400 text-sm">
                      You have posted {jobs.length} jobs
                    </p>
                  </div>

                  <div className="border-l-2 border-blue-400 pl-4">
                    <p className="font-semibold">Applications Received</p>

                    <p className="text-gray-400 text-sm">
                      {applications.length} applications received
                    </p>
                  </div>

                  <div className="border-l-2 border-purple-400 pl-4">
                    <p className="font-semibold">Interviews</p>

                    <p className="text-gray-400 text-sm">
                      {interviews.length} interviews scheduled
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              YOUR JOBS
          ================================================= */}

          <div id="your-jobs" className="mt-10 scroll-mt-20">
            <h2 className="text-3xl font-bold mb-6">Your Jobs</h2>

            {jobs.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
                <p className="text-gray-400">
                  No jobs found. Click "Create Job" to add your first job.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-6"
                  >
                    <h3 className="text-2xl font-bold text-green-400">
                      {job.title}
                    </h3>

                    <p className="mt-3">
                      <strong>Company:</strong> {job.company}
                    </p>

                    <p className="mt-2">
                      <strong>Location:</strong> {job.location}
                    </p>

                    <p className="mt-2">
                      <strong>Salary:</strong> ₹{job.salary}
                    </p>

                    <p className="mt-2">
                      <strong>Job Type:</strong> {job.job_type}
                    </p>

                    <p className="mt-4 text-gray-400">{job.description}</p>

                    {/* Buttons */}

                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => navigate(`/edit-job/${job.id}`)}
                        className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => openDeleteModal(job.id)}
                        className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =================================================
              APPLICANTS
          ================================================= */}

          <div id="applicants" className="mt-12 scroll-mt-20">
            <h2 className="text-3xl font-bold mb-6">Applicants</h2>

            {applications.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <p className="text-gray-400">No applicants yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {applications.map((application) => (
                  <div
                    key={application.id}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-6"
                  >
                    <h3 className="text-xl font-bold text-green-400">
                      {application.candidate_username ||
                        application.candidate?.username ||
                        "Candidate"}
                    </h3>

                    <p className="mt-3">
                      <strong>Job:</strong>{" "}
                      {application.job_title || application.job?.title || "Job"}
                    </p>

                    <p className="mt-2">
                      <strong>Status:</strong>{" "}
                      <span className="text-yellow-400">
                        {application.status}
                      </span>
                    </p>

                    <p className="mt-2 text-gray-400">
                      Applied on:{" "}
                      {application.applied_at
                        ? new Date(application.applied_at).toLocaleDateString()
                        : "N/A"}
                    </p>

                    {/* Cover Letter */}

                    {application.cover_letter && (
                      <div className="mt-4">
                        <p className="font-semibold">Cover Letter:</p>

                        <p className="text-gray-400 mt-1">
                          {application.cover_letter}
                        </p>
                      </div>
                    )}

                    {/* Resume */}

                    {application.resume && (
                      <button
                        type="button"
                        onClick={() => handleResumeDownload(application.id)}
                        className="inline-block mt-5 bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                      >
                        View Resume
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      {deleteJobId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-red-500">Delete Job</h2>

            <p className="text-gray-300 mt-4">
              Deleting this job will also permanently remove all its
              applications, interview records, and uploaded resumes. Candidate
              accounts will not be deleted.
            </p>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={closeDeleteModal}
                className="bg-gray-600 hover:bg-gray-700 px-5 py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
