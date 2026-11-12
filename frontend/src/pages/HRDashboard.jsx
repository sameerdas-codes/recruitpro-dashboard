import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBriefcase,
  FaCalendarAlt,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaFileAlt,
  FaHome,
  FaMapMarkerAlt,
  FaPlus,
  FaSearch,
  FaSignOutAlt,
  FaTimes,
  FaUsers,
} from "react-icons/fa";
import { toast } from "react-toastify";
import NotificationBell from "../components/NotificationBell";
import api, { downloadResume } from "../services/api";
import "../styles/HRDashboard.css";

const candidateName = (application) =>
  application.candidate_name ||
  application.candidate_username ||
  application.candidate?.username ||
  "Candidate";

const jobTitle = (application) =>
  application.job_title || application.job?.title || "Position";

const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatInterviewDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

function HRDashboard() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteJobId, setDeleteJobId] = useState(null);
  const [updatingApplicationId, setUpdatingApplicationId] = useState(null);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const navigate = useNavigate();

  const loadUser = useCallback(async () => {
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

  const loadJobs = useCallback(async (currentUser) => {
    try {
      if (!currentUser) return setJobs([]);
      const response = await api.get("/jobs/");
      setJobs(
        ["hr", "admin"].includes(currentUser.role)
          ? response.data.filter(
              (job) => String(job.created_by) === String(currentUser.id),
            )
          : response.data,
      );
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    }
  }, []);

  const loadApplications = useCallback(async () => {
    try {
      const response = await api.get("/applications/");
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    }
  }, []);

  const loadInterviews = useCallback(async () => {
    try {
      const response = await api.get("/interviews/");
      setInterviews(response.data);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      toast.error("Failed to load interviews");
    }
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const currentUser = await loadUser();
      await Promise.all([
        loadJobs(currentUser),
        loadApplications(),
        loadInterviews(),
      ]);
      setLoading(false);
    };
    loadDashboard();
  }, [loadApplications, loadInterviews, loadJobs, loadUser]);

  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...applications]
      .filter(
        (application) =>
          !query ||
          `${candidateName(application)} ${jobTitle(application)} ${application.status || ""}`
            .toLowerCase()
            .includes(query),
      )
      .sort(
        (a, b) =>
          new Date(b.applied_at || 0).getTime() -
          new Date(a.applied_at || 0).getTime(),
      );
  }, [applications, search]);

  const interviewsByApplication = useMemo(() => {
    const grouped = new Map();
    interviews.forEach((interview) => {
      const applicationId = String(interview.application);
      const applicationInterviews = grouped.get(applicationId) || [];
      applicationInterviews.push(interview);
      grouped.set(applicationId, applicationInterviews);
    });

    grouped.forEach((applicationInterviews) => {
      applicationInterviews.sort((a, b) => {
        const aScheduled = a.status === "Scheduled";
        const bScheduled = b.status === "Scheduled";
        if (aScheduled !== bScheduled) return aScheduled ? -1 : 1;
        const dateDifference =
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime();
        return aScheduled ? dateDifference : -dateDifference;
      });
    });

    return grouped;
  }, [interviews]);

  const interviewForApplication = (application) =>
    interviewsByApplication.get(String(application.id))?.[0] || null;

  const interviewDates = useMemo(
    () => new Set(interviews.map((interview) => toDateKey(interview.scheduled_at))),
    [interviews],
  );
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const todayKey = toDateKey(new Date());
  const selectedInterviews = interviews.filter(
    (interview) => toDateKey(interview.scheduled_at) === selectedDate,
  );
  const firstName = user?.first_name || user?.username || "there";
  const needsReview = applications.filter((application) =>
    ["pending", "review", "under review"].includes(
      String(application.status || "").toLowerCase(),
    ),
  ).length;
  const newApplications = applications.filter(
    (application) => String(application.status || "Pending").toLowerCase() === "pending",
  ).length;

  const countForJob = (job) =>
    applications.filter(
      (application) =>
        String(application.job) === String(job.id) ||
        String(application.job?.id) === String(job.id),
    ).length;

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const download = async (id) => {
    try {
      await downloadResume(id);
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast.error("Failed to download resume");
    }
  };

  const updateApplicationStatus = async (application, status) => {
    setUpdatingApplicationId(application.id);
    try {
      const response = await api.patch(`/applications/${application.id}/`, {
        status,
      });
      setApplications((items) =>
        items.map((item) =>
          item.id === application.id ? response.data : item,
        ),
      );
      toast.success(
        status === "Shortlisted"
          ? `${candidateName(application)} approved for the next stage`
          : `${candidateName(application)} application rejected`,
      );
    } catch (error) {
      console.error("Error updating application status:", error);
      const detail = error.response?.data;
      toast.error(
        detail?.status?.[0] ||
          detail?.detail ||
          "Failed to update application status",
      );
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const deleteJob = async () => {
    try {
      const removedApplications = applications.filter(
        (application) => String(application.job) === String(deleteJobId),
      );
      await api.delete(`/jobs/${deleteJobId}/`);
      setJobs((items) =>
        items.filter((job) => String(job.id) !== String(deleteJobId)),
      );
      setApplications((items) =>
        items.filter(
          (application) => String(application.job) !== String(deleteJobId),
        ),
      );
      const removedIds = new Set(removedApplications.map((item) => String(item.id)));
      setInterviews((items) =>
        items.filter((item) => !removedIds.has(String(item.application))),
      );
      setDeleteJobId(null);
      toast.success("Job and its applications deleted successfully!");
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    }
  };

  if (loading) {
    return (
      <div className="hr-loading" role="status">
        <span className="hr-spinner" />
        Loading your recruitment workspace...
      </div>
    );
  }

  return (
    <div className="hr-app">
      <aside className="hr-sidebar">
        <button type="button" className="hr-brand" onClick={() => scrollTo("hr-home")}>
          <span className="hr-brand-mark"><FaBriefcase /></span>
          <span>recruit<span>pro</span></span>
        </button>
        <nav className="hr-nav" aria-label="Dashboard navigation">
          <button type="button" className="hr-nav-link is-active" onClick={() => scrollTo("hr-home")}><FaHome /><span>Dashboard</span></button>
          <button type="button" className="hr-nav-link" onClick={() => scrollTo("hr-jobs")}><FaBriefcase /><span>Recruitment</span></button>
          <button type="button" className="hr-nav-link" onClick={() => scrollTo("hr-applicants")}><FaFileAlt /><span>Applicants</span><span className="hr-nav-count">{applications.length}</span></button>
          <button type="button" className="hr-nav-link" onClick={() => navigate("/interviews")}><FaCalendarAlt /><span>Calendar</span></button>
          <button type="button" className="hr-nav-link" onClick={() => navigate("/interviews")}><FaUsers /><span>Recruitment tasks</span></button>
          <button type="button" className="hr-nav-link" onClick={() => navigate("/settings")}><FaCog /><span>Settings</span></button>
        </nav>
        <div className="hr-sidebar-bottom">
          <div className="hr-support-art" aria-hidden="true"><span>✦</span><span>☺</span><span>✦</span></div>
          <div className="hr-support-card"><strong>Need a hand?</strong><span>We&apos;re here for your team.</span><button type="button" onClick={() => navigate("/contact")}>Contact support <FaArrowRight /></button></div>
        </div>
      </aside>

      <div className="hr-main">
        <header className="hr-topbar">
          <div className="hr-page-heading"><span className="hr-eyebrow">WORKSPACE</span><h1>Dashboard</h1></div>
          <div className="hr-topbar-actions">
            <label className="hr-search"><FaSearch aria-hidden="true" /><input type="search" aria-label="Search applicants" placeholder="Search applicants" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <div className="hr-notification"><NotificationBell /></div>
            <button type="button" className="hr-profile-button" onClick={() => navigate("/hr/profile")}><span className="hr-avatar hr-profile-avatar">{user?.profile_picture ? <img src={user.profile_picture} alt="" /> : firstName.slice(0, 1).toUpperCase()}</span><span className="hr-profile-name">{firstName}</span><FaChevronRight className="hr-profile-chevron" /></button>
            <button type="button" className="hr-logout-button" onClick={logout} aria-label="Log out" title="Log out"><FaSignOutAlt /></button>
          </div>
        </header>

        <main className="hr-content" id="hr-home">
          <div className="hr-dashboard-grid">
            <section className="hr-primary-column">
              <section className="hr-welcome-banner">
                <div className="hr-welcome-copy"><span className="hr-banner-kicker">YOUR PEOPLE, YOUR PRIORITY</span><h2>Hello, {firstName}!</h2><p>You have <strong>{newApplications} new applications.</strong> Let&apos;s find your next great hire.</p><button type="button" className="hr-banner-link" onClick={() => scrollTo("hr-applicants")}>Review applicants <FaArrowRight /></button></div>
                <div className="hr-welcome-illustration" aria-hidden="true"><span className="hr-spark spark-one">✦</span><span className="hr-spark spark-two">✦</span><div className="hr-laptop"><span /></div><div className="hr-person"><span className="hr-person-hair" /><span className="hr-person-face" /><span className="hr-person-body" /><span className="hr-person-arm" /></div></div>
              </section>

              <section className="hr-section" aria-labelledby="positions-title">
                <div className="hr-section-heading"><div><span className="hr-eyebrow">PIPELINE OVERVIEW</span><h2 id="positions-title">You need to hire</h2></div><button type="button" className="hr-text-link" onClick={() => scrollTo("hr-jobs")}>See all <FaArrowRight /></button></div>
                {jobs.length === 0 ? <div className="hr-empty-positions"><span className="hr-empty-icon"><FaBriefcase /></span><div><strong>No open positions yet</strong><p>Create a job to start building your hiring pipeline.</p></div><button type="button" className="hr-button-primary" onClick={() => navigate("/create-job")}><FaPlus /> Create job</button></div> : <div className="hr-position-grid">{jobs.slice(0, 4).map((job, index) => <article className="hr-position-card" key={job.id}><span className={`hr-position-icon tone-${index % 4}`}><FaBriefcase /></span><span className="hr-position-info"><strong>{job.title}</strong><span>{countForJob(job)} candidates</span></span><span className={`hr-position-ring tone-${index % 4}`}>{countForJob(job)}</span></article>)}</div>}
              </section>

              <section className="hr-panel hr-progress-panel" aria-labelledby="progress-title">
                <div className="hr-panel-heading"><div><span className="hr-eyebrow">THE LATEST</span><h2 id="progress-title">Recruitment progress</h2></div><button type="button" className="hr-button-secondary" onClick={() => scrollTo("hr-applicants")}>See all <FaArrowRight /></button></div>
                <div className="hr-table-wrap"><table className="hr-applications-table"><thead><tr><th>Full name</th><th>Position</th><th>Applied</th><th>Status</th><th aria-label="Review actions" /></tr></thead><tbody>
                  {visibleApplications.slice(0, 5).map((application) => {
                    const applicationStatus = String(application.status || "Pending").toLowerCase();
                    const interview = interviewForApplication(application);
                    const isUpdating = updatingApplicationId === application.id;
                    return (
                      <tr key={application.id}>
                        <td><span className="hr-table-candidate"><span className="hr-avatar">{candidateName(application).slice(0, 1).toUpperCase()}</span><strong>{candidateName(application)}</strong></span></td>
                        <td>{jobTitle(application)}</td>
                        <td>{application.applied_at ? new Date(application.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</td>
                        <td>
                          <span className={`hr-status status-${applicationStatus.replace(/\s+/g, "-")}`}><span />{application.status || "Pending"}</span>
                          {interview && (
                            <div className="hr-interview-summary">
                              <span className={`hr-interview-status status-${interview.status.toLowerCase()}`}>
                                <span />Interview {interview.status.toLowerCase()}
                              </span>
                              <span>{formatInterviewDateTime(interview.scheduled_at)} · {interview.interviewer_username || "Interviewer"}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="hr-table-review-actions">
                            {applicationStatus === "pending" && (
                              <>
                                <button type="button" className="hr-application-approve" disabled={isUpdating} aria-label={`Approve ${candidateName(application)}`} onClick={() => updateApplicationStatus(application, "Shortlisted")}><FaCheck /></button>
                                <button type="button" className="hr-application-reject" disabled={isUpdating} aria-label={`Reject ${candidateName(application)}`} onClick={() => updateApplicationStatus(application, "Rejected")}><FaTimes /></button>
                              </>
                            )}
                            {applicationStatus === "shortlisted" && (
                              <button
                                type="button"
                                className={interview?.status === "Scheduled" ? "hr-interview-view" : "hr-application-schedule"}
                                aria-label={`${interview?.status === "Scheduled" ? "View" : interview?.status === "Completed" ? "Schedule next round for" : "Schedule interview for"} ${candidateName(application)}`}
                                onClick={() => navigate(interview?.status === "Scheduled" ? "/interviews" : `/interviews?application=${application.id}`)}
                              >
                                {interview?.status === "Scheduled" ? <><FaCalendarAlt /> View interview</> : <><FaCalendarAlt /> {interview?.status === "Completed" ? "Next round" : interview?.status === "Cancelled" ? "Reschedule" : "Schedule"}</>}
                              </button>
                            )}
                            {application.resume && <button type="button" className="hr-row-action" aria-label={`Download ${candidateName(application)}'s resume`} onClick={() => download(application.id)}><FaArrowRight /></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {visibleApplications.length === 0 && <tr><td colSpan="5" className="hr-table-empty">{search ? "No applicants match your search." : "Your applicants will appear here as they apply."}</td></tr>}
                </tbody></table></div>
              </section>

              <section className="hr-panel" id="hr-jobs">
                <div className="hr-panel-heading"><div><span className="hr-eyebrow">MANAGE ROLES</span><h2>Your jobs</h2></div><button type="button" className="hr-button-primary" onClick={() => navigate("/create-job")}><FaPlus /> Create job</button></div>
                {jobs.length === 0 ? <p className="hr-panel-empty">No jobs found. Create your first position to get started.</p> : <div className="hr-job-list">{jobs.map((job) => <article className="hr-job-row" key={job.id}><span className="hr-job-row-icon"><FaBriefcase /></span><div className="hr-job-row-main"><strong>{job.title}</strong><span><FaMapMarkerAlt /> {job.location || "Location not set"} <i /> {job.job_type || "Employment type not set"}</span></div><span className="hr-job-applicant-count">{countForJob(job)} applicants</span><button type="button" className="hr-job-edit" onClick={() => navigate(`/edit-job/${job.id}`)}>Edit</button><button type="button" className="hr-job-delete" onClick={() => setDeleteJobId(job.id)}>Delete</button></article>)}</div>}
              </section>

              <section className="hr-panel" id="hr-applicants">
                <div className="hr-panel-heading"><div><span className="hr-eyebrow">CANDIDATE DIRECTORY</span><h2>All applicants</h2></div><span className="hr-total-count">{visibleApplications.length} candidates</span></div>
                {visibleApplications.length === 0 ? <p className="hr-panel-empty">{search ? "No applicants match your search." : "No applicants yet."}</p> : <div className="hr-applicant-list">{visibleApplications.map((application) => {
                  const applicationStatus = String(application.status || "Pending").toLowerCase();
                  const interview = interviewForApplication(application);
                  const isUpdating = updatingApplicationId === application.id;
                  return (
                    <article className="hr-applicant-row" key={application.id}>
                      <span className="hr-avatar">{candidateName(application).slice(0, 1).toUpperCase()}</span>
                      <div className="hr-applicant-info"><strong>{candidateName(application)}</strong><span>{jobTitle(application)}</span></div>
                      <span className="hr-applicant-date">{application.applied_at ? new Date(application.applied_at).toLocaleDateString() : "Date unavailable"}</span>
                      <span className={`hr-status status-${applicationStatus.replace(/\s+/g, "-")}`}><span />{application.status || "Pending"}</span>
                      {application.resume && <button type="button" className="hr-resume-button" onClick={() => download(application.id)}>View resume</button>}
                      {applicationStatus === "pending" && (
                        <div className="hr-application-actions" aria-label={`Review ${candidateName(application)}'s application`}>
                          <button type="button" className="hr-application-approve" disabled={isUpdating} onClick={() => updateApplicationStatus(application, "Shortlisted")}><FaCheck /> Approve</button>
                          <button type="button" className="hr-application-reject" disabled={isUpdating} onClick={() => updateApplicationStatus(application, "Rejected")}><FaTimes /> Reject</button>
                        </div>
                      )}
                      {interview && (
                        <div className="hr-interview-summary hr-applicant-interview-summary">
                          <span className={`hr-interview-status status-${interview.status.toLowerCase()}`}>
                            <span />Interview {interview.status.toLowerCase()}
                          </span>
                          <span>{formatInterviewDateTime(interview.scheduled_at)} · {interview.interviewer_username || "Interviewer"}</span>
                        </div>
                      )}
                      {applicationStatus === "shortlisted" && (
                        <button
                          type="button"
                          className={interview?.status === "Scheduled" ? "hr-interview-view" : "hr-application-schedule"}
                          onClick={() => navigate(interview?.status === "Scheduled" ? "/interviews" : `/interviews?application=${application.id}`)}
                        >
                          <FaCalendarAlt /> {interview?.status === "Scheduled" ? "View interview" : interview?.status === "Completed" ? "Schedule next round" : interview?.status === "Cancelled" ? "Reschedule interview" : "Schedule interview"}
                        </button>
                      )}
                      {application.cover_letter && <details className="hr-cover-letter"><summary>Cover letter</summary><p>{application.cover_letter}</p></details>}
                    </article>
                  );
                })}</div>}
              </section>
            </section>

            <aside className="hr-secondary-column">
              <section className="hr-panel hr-calendar-panel">
                <h2 className="hr-calendar-title">Calendar</h2>
                <div className="hr-calendar-heading"><button type="button" aria-label="Previous month" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}><FaChevronLeft /></button><strong>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</strong><button type="button" aria-label="Next month" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}><FaChevronRight /></button></div>
                <div className="hr-calendar-grid" role="grid" aria-label="Interview calendar">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span className="hr-calendar-weekday" key={day}>{day}</span>)}{Array.from({ length: firstWeekday }, (_, index) => <span className="hr-calendar-blank" key={`blank-${index}`} />)}{Array.from({ length: daysInMonth }, (_, index) => { const day = index + 1; const key = toDateKey(new Date(month.getFullYear(), month.getMonth(), day)); const scheduled = interviewDates.has(key); return <button type="button" role="gridcell" aria-label={`${month.toLocaleDateString("en-US", { month: "long" })} ${day}${scheduled ? ", interview scheduled" : ""}`} aria-pressed={selectedDate === key} className={`hr-calendar-day${key === todayKey ? " is-today" : ""}${selectedDate === key ? " is-selected" : ""}`} key={key} onClick={() => setSelectedDate(key)}>{day}{scheduled && <span />}</button>; })}</div>
                <div className="hr-calendar-events"><div className="hr-calendar-events-heading"><strong>{selectedDate === todayKey ? "Today" : new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong><button type="button" onClick={() => navigate("/interviews")}>See all</button></div>{selectedInterviews.length === 0 ? <p className="hr-no-interviews">No interviews scheduled.</p> : selectedInterviews.slice(0, 3).map((interview) => <div className="hr-calendar-event" key={interview.id}><span className="hr-event-dot" /><div><strong>{interview.job_title || "Interview"}</strong><span>{interview.candidate_username || "Candidate"}</span></div><time>{new Date(interview.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></div>)}</div>
              </section>

              <section className="hr-panel hr-new-applicants">
                <div className="hr-panel-heading"><div><span className="hr-eyebrow">FRESH FACES</span><h2>New applicants</h2></div><button type="button" className="hr-icon-link" aria-label="View all applicants" onClick={() => scrollTo("hr-applicants")}><FaArrowRight /></button></div>
                {visibleApplications.length === 0 ? <p className="hr-panel-empty">New applicants will show up here.</p> : <div className="hr-new-applicant-list">{visibleApplications.slice(0, 5).map((application) => <article className="hr-new-applicant" key={application.id}><span className="hr-avatar">{candidateName(application).slice(0, 1).toUpperCase()}</span><div><strong>{candidateName(application)}</strong><span>Applied for {jobTitle(application)}</span></div>{application.resume && <button type="button" aria-label={`Download ${candidateName(application)}'s resume`} onClick={() => download(application.id)}><FaFileAlt /></button>}</article>)}</div>}
              </section>

              <section className="hr-insight-card"><span className="hr-insight-icon"><FaUsers /></span><span className="hr-eyebrow">HIRING SNAPSHOT</span><strong>{needsReview} to review</strong><p>{jobs.length} open {jobs.length === 1 ? "role" : "roles"} and {interviews.length} scheduled {interviews.length === 1 ? "interview" : "interviews"}.</p><button type="button" onClick={() => scrollTo("hr-applicants")}>View pipeline <FaArrowRight /></button></section>
            </aside>
          </div>
        </main>
      </div>

      {deleteJobId && <div className="hr-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteJobId(null); }}><section className="hr-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-job-title"><button type="button" className="hr-modal-close" aria-label="Close dialog" onClick={() => setDeleteJobId(null)}>×</button><span className="hr-delete-icon"><FaBriefcase /></span><h2 id="delete-job-title">Delete this job?</h2><p>Deleting this job will also permanently remove all its applications, interview records, and uploaded resumes. Candidate accounts will not be deleted.</p><div className="hr-modal-actions"><button type="button" className="hr-button-secondary" onClick={() => setDeleteJobId(null)}>Keep job</button><button type="button" className="hr-button-danger" onClick={deleteJob}>Delete job</button></div></section></div>}
    </div>
  );
}

export default HRDashboard;
