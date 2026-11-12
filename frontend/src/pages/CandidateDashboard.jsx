import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBell,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCog,
  FaExternalLinkAlt,
  FaFileAlt,
  FaHome,
  FaMapMarkerAlt,
  FaSearch,
  FaSignOutAlt,
  FaStar,
  FaTimesCircle,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import { toast } from "react-toastify";
import NotificationBell from "../components/NotificationBell";
import useNotifications from "../hooks/useNotifications";
import api, { downloadResume } from "../services/api";
import "../styles/CandidateDashboard.css";

const getJobTitle = (application) =>
  application.job_title || application.job?.title || "Position";

const getDate = (value, options = { month: "short", day: "numeric", year: "numeric" }) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, options);
};

const getStatusClass = (status) => {
  const normalized = String(status || "Pending").toLowerCase();
  if (normalized.includes("shortlist")) return "shortlisted";
  if (normalized.includes("reject") || normalized.includes("not selected")) return "rejected";
  if (normalized.includes("interview")) return "interview";
  if (normalized.includes("review")) return "review";
  return "pending";
};

function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showAllApplications, setShowAllApplications] = useState(false);
  const navigate = useNavigate();
  const {
    unreadCount,
    notifications,
    loading: notificationsLoading,
    error: notificationsError,
  } = useNotifications();

  const fetchJobs = useCallback(async () => {
    try {
      const response = await api.get("/jobs/");
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load available jobs");
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const response = await api.get("/applications/");
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load your applications");
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get("/accounts/me/");
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
    }
  }, [navigate]);

  const fetchInterviews = useCallback(async () => {
    try {
      const response = await api.get("/interviews/");
      setInterviews(response.data);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      toast.error("Failed to load interviews");
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
    fetchUser();
    fetchInterviews();
  }, [fetchApplications, fetchInterviews, fetchJobs, fetchUser]);

  const sortedApplications = useMemo(
    () =>
      [...applications].sort(
        (a, b) =>
          new Date(b.applied_at || 0).getTime() -
          new Date(a.applied_at || 0).getTime(),
      ),
    [applications],
  );

  const upcomingInterviews = useMemo(
    () =>
      interviews
        .filter(
          (interview) =>
            interview.status !== "Cancelled" &&
            new Date(interview.scheduled_at).getTime() >= Date.now(),
        )
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime(),
        ),
    [interviews],
  );

  const shortlistedCount = applications.filter((application) =>
    String(application.status || "").toLowerCase().includes("shortlist"),
  ).length;
  const rejectedCount = applications.filter((application) => {
    const status = String(application.status || "").toLowerCase();
    return status.includes("reject") || status.includes("not selected");
  }).length;
  const appliedJobIds = new Set(
    applications.map((application) =>
      String(application.job?.id ?? application.job),
    ),
  );
  const firstName = user?.first_name || user?.username || "there";

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) =>
      !query ||
      `${job.title} ${job.company} ${job.location} ${job.job_type}`
        .toLowerCase()
        .includes(query),
    );
  }, [jobs, search]);

  const activityItems = useMemo(() => {
    return notifications
      .map((notification) => {
        const message = notification.message || "";
        const normalizedMessage = message.toLowerCase();
        let item = {
          id: notification.id,
          kind: "pending",
          title: "Application update",
          icon: FaFileAlt,
        };

        if (notification.notification_type === "application_status") {
          if (normalizedMessage.includes("shortlist")) {
            item = {
              ...item,
              kind: "shortlisted",
              title: "Application shortlisted",
              icon: FaCheckCircle,
            };
          } else if (
            normalizedMessage.includes("reject") ||
            normalizedMessage.includes("not selected")
          ) {
            item = {
              ...item,
              kind: "rejected",
              title: "Application status updated",
              icon: FaTimesCircle,
            };
          } else {
            item = {
              ...item,
              kind: "review",
              title: "Application status updated",
              icon: FaClock,
            };
          }
        } else if (notification.notification_type === "interview") {
          const removed = normalizedMessage.includes("removed");
          const cancelled =
            normalizedMessage.includes("cancelled") || removed;
          const completed = normalizedMessage.includes("completed");
          item = {
            ...item,
            kind: cancelled ? "rejected" : completed ? "completed" : "interview",
            title: cancelled
              ? removed
                ? "Interview removed"
                : "Interview cancelled"
              : completed
                ? "Interview completed"
                : normalizedMessage.includes("scheduled")
                ? "Interview scheduled"
                : "Interview updated",
            icon: cancelled
              ? FaTimesCircle
              : completed
                ? FaCheckCircle
                : FaCalendarAlt,
          };
        } else if (notification.notification_type === "application") {
          item = {
            ...item,
            title: "Application submitted",
            icon: FaCheckCircle,
          };
        }

        return {
          ...item,
          description: message,
          date: notification.created_at,
        };
      })
      .filter((item) => item.date && !Number.isNaN(new Date(item.date).getTime()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
  }, [notifications]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleResumeDownload = async (applicationId) => {
    try {
      await downloadResume(applicationId);
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast.error("Failed to download resume");
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const nextInterview = upcomingInterviews[0];
  const visibleApplications = showAllApplications
    ? sortedApplications
    : sortedApplications.slice(0, 5);

  return (
    <div className="candidate-dashboard">
      <aside className="candidate-sidebar">
        <button
          type="button"
          className="candidate-brand"
          onClick={() => scrollToSection("candidate-home")}
          aria-label="RecruitPro candidate dashboard"
        >
          <span className="candidate-brand-mark"><FaUsers /></span>
          <span>Recruit<span>Pro</span><small>Find your next opportunity</small></span>
        </button>

        <nav className="candidate-nav" aria-label="Candidate navigation">
          <button type="button" className="is-active" onClick={() => scrollToSection("candidate-home")}><FaHome /><span>Dashboard</span></button>
          <button type="button" onClick={() => scrollToSection("available-jobs")}><FaBriefcase /><span>Available jobs</span></button>
          <button type="button" onClick={() => scrollToSection("my-applications")}><FaFileAlt /><span>My applications</span><span className="candidate-nav-count">{applications.length}</span></button>
          <button type="button" onClick={() => navigate("/interviews")}><FaCalendarAlt /><span>Interview schedule</span></button>
          <button type="button" onClick={() => navigate("/notifications")}><FaBell /><span>Notifications</span>{unreadCount > 0 && <span className="candidate-nav-count">{unreadCount}</span>}</button>
          <button type="button" onClick={() => navigate("/candidate/profile")}><FaUser /><span>Profile</span></button>
          <button type="button" onClick={() => navigate("/settings")}><FaCog /><span>Settings</span></button>
        </nav>

        <div className="candidate-sidebar-support">
          <div className="candidate-support-art" aria-hidden="true"><span>✦</span><span>☺</span><span>✦</span></div>
          <div className="candidate-support-card">
            <strong>Need a hand?</strong>
            <span>We&apos;re here to help with your job search.</span>
            <button type="button" onClick={() => navigate("/contact")}>Contact support <FaArrowRight /></button>
          </div>
        </div>

      </aside>

      <div className="candidate-main">
        <header className="candidate-topbar">
          <label className="candidate-search">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              aria-label="Search available jobs"
              placeholder="Search jobs, companies, locations..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => scrollToSection("available-jobs")}
            />
          </label>
          <div className="candidate-topbar-actions">
            <NotificationBell />
            <button type="button" className="candidate-profile-button" onClick={() => navigate("/candidate/profile")}>
              <span className="candidate-avatar">{user?.profile_picture ? <img src={user.profile_picture} alt="" /> : firstName.slice(0, 1).toUpperCase()}</span>
              <span>{firstName}</span>
            </button>
            <button type="button" className="candidate-topbar-logout" onClick={handleLogout} aria-label="Log out" title="Log out"><FaSignOutAlt /></button>
          </div>
        </header>

        <main className="candidate-content" id="candidate-home">
          <section className="candidate-welcome">
            <div className="candidate-welcome-copy">
              <span className="candidate-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
              <h1>Welcome back, {firstName}!</h1>
              <p>Explore new opportunities and take the next step in your career.</p>
              <button type="button" className="candidate-welcome-button" onClick={() => scrollToSection("available-jobs")}>Browse jobs <FaArrowRight /></button>
            </div>
            <div className="candidate-welcome-art" aria-hidden="true">
              <span className="candidate-art-orbit" />
              <img src="/Developer.png" alt="" />
            </div>
          </section>

          <section className="candidate-stats" aria-label="Application overview">
            <article className="candidate-stat-card stat-applications">
              <span className="candidate-stat-icon"><FaFileAlt /></span>
              <div><strong>{applications.length}</strong><span>Total applications</span></div>
              <span className="candidate-stat-spark" aria-hidden="true">⌁</span>
            </article>
            <article className="candidate-stat-card stat-interviews">
              <span className="candidate-stat-icon"><FaCalendarAlt /></span>
              <div><strong>{upcomingInterviews.length}</strong><span>Upcoming interviews</span></div>
              <span className="candidate-stat-spark" aria-hidden="true">⌁</span>
            </article>
            <article className="candidate-stat-card stat-shortlisted">
              <span className="candidate-stat-icon"><FaStar /></span>
              <div><strong>{shortlistedCount}</strong><span>Shortlisted</span></div>
              <span className="candidate-stat-spark" aria-hidden="true">⌁</span>
            </article>
            <article className="candidate-stat-card stat-rejected">
              <span className="candidate-stat-icon"><FaTimesCircle /></span>
              <div><strong>{rejectedCount}</strong><span>Not selected</span></div>
              <span className="candidate-stat-spark" aria-hidden="true">⌁</span>
            </article>
          </section>

          <div className="candidate-dashboard-grid">
            <section className="candidate-panel candidate-applications-panel" id="my-applications">
              <div className="candidate-panel-heading">
                <div><span className="candidate-eyebrow">YOUR JOB SEARCH</span><h2><FaBriefcase /> My applications</h2></div>
                {sortedApplications.length > 5 && (
                  <button type="button" className="candidate-text-link" onClick={() => setShowAllApplications((value) => !value)}>
                    {showAllApplications ? "Show recent" : "View all"} <FaArrowRight />
                  </button>
                )}
              </div>
              {applications.length === 0 ? (
                <div className="candidate-empty-state">
                  <span><FaFileAlt /></span>
                  <strong>No applications yet</strong>
                  <p>Find a role that fits and your applications will show up here.</p>
                  <button type="button" onClick={() => scrollToSection("available-jobs")}>Explore jobs <FaArrowRight /></button>
                </div>
              ) : (
                <div className="candidate-table-wrap">
                  <table className="candidate-applications-table">
                    <thead><tr><th>Job title</th><th>Company</th><th>Status</th><th>Applied on</th><th>Resume</th></tr></thead>
                    <tbody>
                      {visibleApplications.map((application) => {
                        const relatedJob = jobs.find((job) => String(job.id) === String(application.job?.id ?? application.job));
                        return (
                          <tr key={application.id}>
                            <td><strong>{getJobTitle(application)}</strong></td>
                            <td>{relatedJob?.company || "—"}</td>
                            <td><span className={`candidate-status status-${getStatusClass(application.status)}`}><span />{application.status || "Pending"}</span></td>
                            <td>{getDate(application.applied_at, { month: "short", day: "numeric", year: "numeric" })}</td>
                            <td><button type="button" className="candidate-resume-button" onClick={() => handleResumeDownload(application.id)} aria-label={`View resume for ${getJobTitle(application)}`}><FaExternalLinkAlt /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="candidate-side-panels">
              <section className="candidate-panel candidate-interview-panel">
                <div className="candidate-panel-heading">
                  <div><span className="candidate-eyebrow">GET READY FOR WHAT'S NEXT</span><h2><FaCalendarAlt /> Upcoming interview</h2></div>
                  <button type="button" className="candidate-text-link" onClick={() => navigate("/interviews")}>View all <FaArrowRight /></button>
                </div>
                {nextInterview ? (
                  <div className="candidate-interview-card">
                    <div className="candidate-interview-date">
                      <span>{getDate(nextInterview.scheduled_at, { month: "short" })}</span>
                      <strong>{new Date(nextInterview.scheduled_at).getDate()}</strong>
                      <span>{getDate(nextInterview.scheduled_at, { weekday: "short" })}</span>
                    </div>
                    <div className="candidate-interview-info">
                      <strong>{nextInterview.job_title || "Interview"}</strong>
                      <span>{jobs.find((job) => String(job.title) === String(nextInterview.job_title))?.company || "Your upcoming interview"}</span>
                      <span><FaClock /> {new Date(nextInterview.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                      <span><FaMapMarkerAlt /> {nextInterview.meeting_link ? "Online meeting" : "Check interview details"}</span>
                    </div>
                    {nextInterview.meeting_link ? (
                      <a className="candidate-interview-action" href={nextInterview.meeting_link} target="_blank" rel="noreferrer">Join <FaArrowRight /></a>
                    ) : (
                      <button type="button" className="candidate-interview-action" onClick={() => navigate("/interviews")}>Details <FaArrowRight /></button>
                    )}
                  </div>
                ) : (
                  <div className="candidate-no-interview">
                    <span><FaCalendarAlt /></span>
                    <div><strong>No upcoming interviews</strong><p>We&apos;ll show your next interview here when it&apos;s scheduled.</p></div>
                  </div>
                )}
              </section>

              <section className="candidate-panel candidate-activity-panel">
                <div className="candidate-panel-heading">
                  <div><span className="candidate-eyebrow">YOUR LATEST UPDATES</span><h2><FaClock /> Recent activity</h2></div>
                  <button type="button" className="candidate-text-link" onClick={() => navigate("/notifications")}>View all <FaArrowRight /></button>
                </div>
                {notificationsError ? (
                  <p className="candidate-activity-empty">{notificationsError}</p>
                ) : notificationsLoading && activityItems.length === 0 ? (
                  <p className="candidate-activity-empty">Loading your latest updates...</p>
                ) : activityItems.length === 0 ? (
                  <p className="candidate-activity-empty">Your application and interview updates will appear here.</p>
                ) : (
                  <ul className="candidate-activity-list">
                    {activityItems.map((item) => {
                      const ActivityIcon = item.icon;
                      return (
                        <li key={item.id}>
                          <span className={`candidate-activity-icon activity-${item.kind}`}><ActivityIcon /></span>
                          <div className="candidate-activity-copy">
                            <strong>{item.title}</strong>
                            <p>{item.description}</p>
                          </div>
                          <time dateTime={item.date}>{getDate(item.date, { month: "short", day: "numeric" })}</time>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          </div>

          <section className="candidate-interview-guide">
            <span className="candidate-guide-icon"><FaStar /></span>
            <div><span className="candidate-eyebrow">MAKE A GREAT IMPRESSION</span><h2>Get ready for your next interview</h2><p>Review your schedule and interview details so you can feel prepared.</p></div>
            <button type="button" onClick={() => navigate("/interviews")}>View interview schedule <FaArrowRight /></button>
          </section>

          <section className="candidate-jobs-section" id="available-jobs">
            <div className="candidate-section-heading">
              <div><span className="candidate-eyebrow">FIND YOUR FIT</span><h2>Explore available jobs</h2><p>Discover roles that match your next career move.</p></div>
              <span className="candidate-job-count">{filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} found</span>
            </div>
            {loadingJobs ? (
              <div className="candidate-empty-state"><span><FaBriefcase /></span><strong>Loading available jobs...</strong></div>
            ) : filteredJobs.length === 0 ? (
              <div className="candidate-empty-state">
                <span><FaSearch /></span>
                <strong>{search ? "No jobs match your search" : "No jobs available right now"}</strong>
                <p>{search ? "Try a different title, company, or location." : "Check back soon for new opportunities."}</p>
              </div>
            ) : (
              <div className="candidate-job-grid">
                {filteredJobs.slice(0, 6).map((job) => {
                  const alreadyApplied = appliedJobIds.has(String(job.id));
                  return (
                    <article className="candidate-job-card" key={job.id}>
                      <span className="candidate-job-icon"><FaBuilding /></span>
                      <span className="candidate-job-type">{job.job_type || "Open role"}</span>
                      <h3>{job.title}</h3>
                      <p className="candidate-job-company">{job.company}</p>
                      <div className="candidate-job-meta">
                        <span><FaMapMarkerAlt />{job.location || "Location not specified"}</span>
                        {job.salary && <span>{`₹${Number(job.salary).toLocaleString("en-IN")}`}</span>}
                      </div>
                      <p className="candidate-job-description">{job.description}</p>
                      <button type="button" disabled={alreadyApplied} onClick={() => navigate(`/apply-job/${job.id}`)}>
                        {alreadyApplied ? "Already applied" : "View and apply"} {!alreadyApplied && <FaArrowRight />}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default CandidateDashboard;
