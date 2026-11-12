import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBell,
  FaBriefcase,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCog,
  FaEnvelope,
  FaFileAlt,
  FaHome,
  FaSearch,
  FaSignOutAlt,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import { toast } from "react-toastify";
import useNotifications from "../hooks/useNotifications";
import api, { downloadInterviewCandidateResume } from "../services/api";
import "../styles/InterviewerDashboard.css";

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const formatDate = (value, options = { month: "short", day: "numeric" }) =>
  isValidDate(value)
    ? new Date(value).toLocaleDateString(undefined, options)
    : "Date unavailable";

const formatTime = (value) =>
  isValidDate(value)
    ? new Date(value).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : "Time unavailable";

const getInterviewDateKey = (value) => {
  if (!isValidDate(value)) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getCandidateName = (interview) =>
  interview.candidate_name || interview.candidate_username || "Assigned candidate";

const getRelativeTime = (value) => {
  if (!isValidDate(value)) return "";
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  return `${Math.floor(elapsedHours / 24)}d ago`;
};

function InterviewerDashboard() {
  const [user, setUser] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("upcoming");
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
  } = useNotifications();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [userResponse, interviewResponse] = await Promise.all([
        api.get("/accounts/me/"),
        api.get("/interviews/"),
      ]);
      setUser(userResponse.data);
      setInterviews(interviewResponse.data);
    } catch (loadError) {
      console.error("Error loading interviewer dashboard:", loadError);
      setError("Could not load your assigned interviews. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const sortedInterviews = useMemo(
    () =>
      [...interviews].sort((a, b) => {
        const aTime = new Date(a.scheduled_at).getTime();
        const bTime = new Date(b.scheduled_at).getTime();
        const aUpcoming = a.status === "Scheduled" && aTime >= Date.now();
        const bUpcoming = b.status === "Scheduled" && bTime >= Date.now();
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
        return aUpcoming ? aTime - bTime : bTime - aTime;
      }),
    [interviews],
  );

  const visibleInterviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortedInterviews.filter((interview) => {
      const scheduledTime = new Date(interview.scheduled_at).getTime();
      const isUpcoming =
        interview.status === "Scheduled" && scheduledTime >= Date.now();
      const isToday =
        isUpcoming &&
        getInterviewDateKey(interview.scheduled_at) ===
          getInterviewDateKey(new Date());
      const matchesFilter =
        filter === "all" ||
        (filter === "today" && isToday) ||
        (filter === "upcoming" && isUpcoming) ||
        (filter === "completed" && interview.status === "Completed");
      const matchesSearch =
        !query ||
        `${getCandidateName(interview)} ${interview.candidate_email || ""} ${interview.job_title || ""} ${interview.status}`
          .toLowerCase()
          .includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search, sortedInterviews]);

  const selectedInterview =
    visibleInterviews.find(
      (interview) => String(interview.id) === String(selectedInterviewId),
    ) ||
    visibleInterviews[0] ||
    sortedInterviews[0] ||
    null;

  const todayKey = getInterviewDateKey(new Date());
  const todayCount = interviews.filter(
    (interview) =>
      interview.status === "Scheduled" &&
      getInterviewDateKey(interview.scheduled_at) === todayKey,
  ).length;
  const upcomingCount = interviews.filter(
    (interview) =>
      interview.status === "Scheduled" &&
      new Date(interview.scheduled_at).getTime() >= Date.now(),
  ).length;
  const completedCount = interviews.filter(
    (interview) => interview.status === "Completed",
  ).length;
  const assignedInterviewIds = useMemo(
    () => new Set(interviews.map((interview) => String(interview.id))),
    [interviews],
  );
  const recentActivity = notifications
    .filter(
      (notification) =>
        notification.notification_type === "interview" &&
        notification.interview &&
        assignedInterviewIds.has(String(notification.interview)),
    )
    .slice(0, 4);
  const firstName = user?.first_name || user?.username || "there";

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const downloadResume = async (interviewId) => {
    try {
      await downloadInterviewCandidateResume(interviewId);
    } catch (downloadError) {
      console.error("Error downloading assigned candidate resume:", downloadError);
      toast.error("Could not download the candidate resume.");
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  if (loading) {
    return (
      <main className="interviewer-loading" role="status">
        <span className="interviewer-spinner" />
        <span>Preparing your interviewer workspace...</span>
      </main>
    );
  }

  return (
    <div className="interviewer-dashboard">
      <aside className="interviewer-sidebar">
        <button
          type="button"
          className="interviewer-brand"
          onClick={() => scrollTo("interviewer-home")}
          aria-label="RecruitPro interviewer dashboard"
        >
          <span className="interviewer-brand-mark"><FaUsers /></span>
          <span>Recruit<span>Pro</span><small>Hiring, in focus</small></span>
        </button>

        <div className="interviewer-identity">
          <span className="interviewer-avatar">{user?.profile_picture ? <img src={user.profile_picture} alt="" /> : firstName.slice(0, 1).toUpperCase()}</span>
          <strong>{[user?.first_name, user?.last_name].filter(Boolean).join(" ") || firstName}</strong>
          <span><i /> Interviewer</span>
        </div>

        <nav className="interviewer-nav" aria-label="Interviewer navigation">
          <button type="button" className="is-active" onClick={() => scrollTo("interviewer-home")}><FaHome /><span>Dashboard</span></button>
          <button type="button" onClick={() => scrollTo("interviewer-schedule")}><FaCalendarAlt /><span>My interviews</span><span className="interviewer-nav-count">{interviews.length}</span></button>
          <button type="button" onClick={() => scrollTo("interviewer-candidate")}><FaUser /><span>Candidate details</span></button>
          <button type="button" onClick={() => navigate("/notifications")}><FaBell /><span>Notifications</span>{unreadCount > 0 && <span className="interviewer-nav-count">{unreadCount}</span>}</button>
          <button type="button" onClick={() => navigate("/interviewer/profile")}><FaUsers /><span>My profile</span></button>
          <button type="button" onClick={() => navigate("/settings")}><FaCog /><span>Settings</span></button>
        </nav>

        <div className="interviewer-sidebar-note">
          <span><FaCheckCircle /></span>
          <strong>Every interview matters</strong>
          <p>Candidate details are shared with you for interviews assigned to your account.</p>
        </div>

        <button type="button" className="interviewer-logout" onClick={logout}>
          <FaSignOutAlt /><span>Log out</span>
        </button>
      </aside>

      <div className="interviewer-main">
        <header className="interviewer-topbar">
          <label className="interviewer-search">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              aria-label="Search assigned interviews"
              placeholder="Search candidates or positions..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setFilter("all");
              }}
            />
          </label>
          <div className="interviewer-topbar-actions">
            <button
              type="button"
              className="interviewer-notification-button"
              onClick={() => navigate("/notifications")}
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <FaBell />
              {unreadCount > 0 && <span>{unreadCount}</span>}
            </button>
            <button type="button" className="interviewer-profile-button" onClick={() => navigate("/interviewer/profile")}>
              <span>{user?.profile_picture ? <img src={user.profile_picture} alt="" /> : firstName.slice(0, 1).toUpperCase()}</span>
              <strong>{firstName}</strong>
            </button>
            <button type="button" className="interviewer-header-logout" onClick={logout} aria-label="Log out">
              <FaSignOutAlt /><span>Log out</span>
            </button>
          </div>
        </header>

        <main className="interviewer-content" id="interviewer-home">
          <section className="interviewer-welcome">
            <div className="interviewer-welcome-copy">
              <span className="interviewer-eyebrow">YOUR INTERVIEW WORKSPACE</span>
              <h1>Welcome back, {firstName}!</h1>
              <p>Your assigned interview schedule and candidate details, together in one place.</p>
              <button type="button" onClick={() => scrollTo("interviewer-schedule")}>View my schedule <FaArrowRight /></button>
            </div>
            <div className="interviewer-welcome-art" aria-hidden="true">
              <span className="interviewer-art-ring" />
              <span className="interviewer-art-calendar"><FaCalendarAlt /></span>
              <span className="interviewer-art-check"><FaCheckCircle /></span>
              <span className="interviewer-art-quote">Great interviews<br />build great teams.</span>
            </div>
          </section>

          {error && (
            <div className="interviewer-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={loadDashboard}>Try again</button>
            </div>
          )}

          <section className="interviewer-stats" aria-label="Interview overview">
            <article className="interviewer-stat-card stat-today">
              <span className="interviewer-stat-icon"><FaCalendarAlt /></span>
              <span><small>Today&apos;s interviews</small><strong>{todayCount}</strong></span>
              <span className="interviewer-stat-note">Today</span>
            </article>
            <article className="interviewer-stat-card stat-upcoming">
              <span className="interviewer-stat-icon"><FaClock /></span>
              <span><small>Upcoming</small><strong>{upcomingCount}</strong></span>
              <span className="interviewer-stat-note">Scheduled</span>
            </article>
            <article className="interviewer-stat-card stat-completed">
              <span className="interviewer-stat-icon"><FaCheckCircle /></span>
              <span><small>Completed</small><strong>{completedCount}</strong></span>
              <span className="interviewer-stat-note">Interviews</span>
            </article>
          </section>

          <div className="interviewer-dashboard-grid">
            <section className="interviewer-panel interviewer-schedule-panel" id="interviewer-schedule">
              <div className="interviewer-panel-heading">
                <div><span className="interviewer-eyebrow">YOUR ASSIGNED CANDIDATES</span><h2><FaCalendarAlt /> My interview schedule</h2></div>
                <button type="button" onClick={() => navigate("/interviews")}>Full schedule <FaArrowRight /></button>
              </div>
              <div className="interviewer-filter-tabs" role="group" aria-label="Filter interviews">
                {[
                  ["today", "Today"],
                  ["upcoming", "Upcoming"],
                  ["completed", "Completed"],
                  ["all", "All"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={filter === value ? "is-active" : ""}
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {visibleInterviews.length === 0 ? (
                <div className="interviewer-empty">
                  <span><FaCalendarAlt /></span>
                  <strong>{search ? "No interviews match your search" : "No interviews in this view"}</strong>
                  <p>{search ? "Try another candidate name or position." : "Assigned interviews will appear here when an HR team schedules you."}</p>
                  {!search && filter !== "all" && <button type="button" onClick={() => setFilter("all")}>View all assigned interviews</button>}
                </div>
              ) : (
                <div className="interviewer-interview-list">
                  {visibleInterviews.map((interview) => {
                    const selected = String(selectedInterview?.id) === String(interview.id);
                    return (
                      <article className={`interviewer-interview-row${selected ? " is-selected" : ""}`} key={interview.id}>
                        <button
                          type="button"
                          className="interviewer-interview-select"
                          onClick={() => setSelectedInterviewId(interview.id)}
                          aria-label={`View ${getCandidateName(interview)} interview details`}
                        >
                          <span className="interviewer-date-tile">
                            <small>{formatDate(interview.scheduled_at, { month: "short" })}</small>
                            <strong>{isValidDate(interview.scheduled_at) ? new Date(interview.scheduled_at).getDate() : "—"}</strong>
                          </span>
                          <span className="interviewer-interview-info">
                            <strong>{interview.job_title || "Interview"}</strong>
                            <span><FaUser /> {getCandidateName(interview)}</span>
                            <span><FaClock /> {formatTime(interview.scheduled_at)}</span>
                          </span>
                          <span className={`interviewer-status status-${String(interview.status).toLowerCase()}`}><i />{interview.status}</span>
                        </button>
                        {interview.status === "Scheduled" && interview.meeting_link && (
                          <a className="interviewer-join-link" href={interview.meeting_link} target="_blank" rel="noopener noreferrer">
                            Join meeting <FaArrowRight />
                          </a>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="interviewer-side-column">
              <section className="interviewer-panel interviewer-quick-actions">
                <div className="interviewer-panel-heading"><div><span className="interviewer-eyebrow">STAY PREPARED</span><h2>Quick actions</h2></div></div>
                <div className="interviewer-action-grid">
                  <button type="button" onClick={() => scrollTo("interviewer-schedule")}><FaUsers /><span>View assigned<br />candidates</span></button>
                  <button type="button" onClick={() => navigate("/interviews")}><FaCalendarAlt /><span>Open interview<br />schedule</span></button>
                  <button type="button" onClick={() => navigate("/notifications")}><FaBell /><span>View updates<br />and notices</span></button>
                  <button type="button" onClick={() => navigate("/interviewer/profile")}><FaUser /><span>Edit my<br />profile</span></button>
                </div>
              </section>

              <section className="interviewer-panel interviewer-activity">
                <div className="interviewer-panel-heading">
                  <div><span className="interviewer-eyebrow">ASSIGNED INTERVIEW UPDATES</span><h2><FaClock /> Recent activity</h2></div>
                  <button type="button" onClick={() => navigate("/notifications")}>View all <FaArrowRight /></button>
                </div>
                {notificationsError ? (
                  <p className="interviewer-panel-message">{notificationsError}</p>
                ) : notificationsLoading && recentActivity.length === 0 ? (
                  <p className="interviewer-panel-message">Loading recent updates...</p>
                ) : recentActivity.length === 0 ? (
                  <p className="interviewer-panel-message">Updates for your assigned interviews will appear here.</p>
                ) : (
                  <ul className="interviewer-activity-list">
                    {recentActivity.map((notification) => (
                      <li key={notification.id}>
                        <span><FaCalendarAlt /></span>
                        <div><strong>{notification.message}</strong><time>{getRelativeTime(notification.created_at)}</time></div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </aside>
          </div>

          <section className="interviewer-panel interviewer-candidate-panel" id="interviewer-candidate">
            <div className="interviewer-panel-heading">
              <div><span className="interviewer-eyebrow">NEXT CONVERSATION</span><h2><FaUser /> Candidate details</h2></div>
              {selectedInterview && <span className={`interviewer-status status-${String(selectedInterview.status).toLowerCase()}`}><i />{selectedInterview.status}</span>}
            </div>
            {!selectedInterview ? (
              <p className="interviewer-panel-message">Candidate details will be available once an interview is assigned to you.</p>
            ) : (
              <div className="interviewer-candidate-details">
                <span className="interviewer-candidate-avatar">{getCandidateName(selectedInterview).slice(0, 1).toUpperCase()}</span>
                <div className="interviewer-candidate-main">
                  <strong>{getCandidateName(selectedInterview)}</strong>
                  <span><FaBriefcase /> {selectedInterview.job_title || "Position not provided"}</span>
                  {selectedInterview.candidate_email && <span><FaEnvelope /> {selectedInterview.candidate_email}</span>}
                  {selectedInterview.application_applied_at && <span>Applied {formatDate(selectedInterview.application_applied_at, { month: "short", day: "numeric", year: "numeric" })}</span>}
                </div>
                <div className="interviewer-candidate-letter">
                  <span className="interviewer-eyebrow">APPLICATION NOTE</span>
                  <p>{selectedInterview.candidate_cover_letter || "No cover letter was included with this application."}</p>
                </div>
                <div className="interviewer-candidate-actions">
                  {selectedInterview.candidate_resume_available ? (
                    <button type="button" onClick={() => downloadResume(selectedInterview.id)}><FaFileAlt /> Download resume</button>
                  ) : (
                    <span>Resume not available</span>
                  )}
                  {selectedInterview.meeting_link && selectedInterview.status === "Scheduled" && (
                    <a href={selectedInterview.meeting_link} target="_blank" rel="noopener noreferrer"><FaArrowRight /> Join interview</a>
                  )}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default InterviewerDashboard;
