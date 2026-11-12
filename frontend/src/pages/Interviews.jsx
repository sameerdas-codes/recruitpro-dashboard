import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBriefcase,
  FaCalendarAlt,
  FaCalendarCheck,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaExternalLinkAlt,
  FaFileAlt,
  FaInfoCircle,
  FaEnvelope,
  FaTimes,
  FaUserTie,
  FaVideo,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api, { downloadInterviewCandidateResume } from "../services/api";
import "../styles/Interviews.css";

const dateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatDate = (value, options) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, options);
};

const formatTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

const getScheduleErrorMessage = (error) => {
  const data = error.response?.data;
  if (!data) return "Unable to reach the server. Check that the backend is running.";
  if (typeof data === "string") return data;
  if (typeof data.detail === "string") return data.detail;

  const fieldLabels = {
    application: "Candidate",
    interviewer: "Interviewer",
    scheduled_at: "Date and time",
    meeting_link: "Meeting link",
    non_field_errors: "Interview",
  };
  const messages = Object.entries(data).flatMap(([field, value]) => {
    const values = Array.isArray(value) ? value : [value];
    return values
      .filter((message) => typeof message === "string")
      .map((message) => `${fieldLabels[field] || field}: ${message}`);
  });

  if (messages.length) return messages.join(" ");
  if (error.response.status === 401) return "Your session expired. Please sign in again.";
  if (error.response.status === 403) return "Your account is not allowed to schedule interviews.";
  return "Could not schedule the interview. Please check the selected details and try again.";
};

function Interviews() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [updatingInterviewId, setUpdatingInterviewId] = useState(null);
  const [filter, setFilter] = useState("upcoming");
  const [selectedDate, setSelectedDate] = useState("");
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [form, setForm] = useState({
    application: searchParams.get("application") || "",
    interviewer: "",
    scheduled_time: "",
    meeting_link: "",
  });

  const loadPage = useCallback(async () => {
    setError("");
    try {
      const [userResponse, interviewResponse] = await Promise.all([
        api.get("/accounts/me/"),
        api.get("/interviews/"),
      ]);
      setUser(userResponse.data);
      setInterviews(interviewResponse.data);

      if (["hr", "admin"].includes(userResponse.data.role)) {
        const [applicationResponse, interviewerResponse] = await Promise.all([
          api.get("/applications/"),
          api.get("/accounts/interviewers/"),
        ]);
        setApplications(applicationResponse.data);
        setInterviewers(interviewerResponse.data);
      }
    } catch (loadError) {
      console.error("Error loading interviews:", loadError);
      setError("We couldn’t load your interviews. Please try again.");
      toast.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setScheduleError("");
    if (!selectedDate) {
      setScheduleError("Select an interview date from the calendar.");
      return;
    }

    const scheduledAt = new Date(`${selectedDate}T${form.scheduled_time}`);
    if (
      Number.isNaN(scheduledAt.getTime()) ||
      scheduledAt.getTime() <= Date.now()
    ) {
      setScheduleError("Choose a future date and time for the interview.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/interviews/", {
        application: form.application,
        interviewer: form.interviewer,
        scheduled_at: scheduledAt.toISOString(),
        meeting_link: form.meeting_link,
      });
      toast.success("Interview scheduled");
      setForm({
        application: "",
        interviewer: "",
        scheduled_time: "",
        meeting_link: "",
      });
      setSelectedDate("");
      await loadPage();
    } catch (submitError) {
      console.error("Error scheduling interview:", submitError);
      const message = getScheduleErrorMessage(submitError);
      setScheduleError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (interviewId, status) => {
    setUpdatingInterviewId(interviewId);
    try {
      await api.patch(`/interviews/${interviewId}/`, { status });
      toast.success(`Interview marked ${status.toLowerCase()}`);
      await loadPage();
    } catch (updateError) {
      console.error("Error updating interview:", updateError);
      toast.error("Failed to update interview");
    } finally {
      setUpdatingInterviewId(null);
    }
  };

  const downloadCandidateResume = async (interviewId) => {
    try {
      await downloadInterviewCandidateResume(interviewId);
    } catch (downloadError) {
      console.error("Error downloading assigned candidate resume:", downloadError);
      toast.error("Could not download the candidate resume.");
    }
  };

  const canSchedule = ["hr", "admin"].includes(user?.role);
  const shortlistedApplications = applications.filter(
    (application) => String(application.status).toLowerCase() === "shortlisted",
  );
  const selectedApplicationIsShortlisted = shortlistedApplications.some(
    (application) => String(application.id) === String(form.application),
  );
  const now = Date.now();
  const upcomingInterviews = interviews.filter(
    (interview) =>
      interview.status === "Scheduled" &&
      new Date(interview.scheduled_at).getTime() >= now,
  );
  const pastInterviews = interviews.filter(
    (interview) => !upcomingInterviews.includes(interview),
  );
  const visibleInterviews = useMemo(() => {
    const filtered = interviews.filter((interview) => {
      const scheduledTime = new Date(interview.scheduled_at).getTime();
      const isUpcoming = interview.status === "Scheduled" && scheduledTime >= Date.now();
      const matchesStatus =
        filter === "all" ||
        (filter === "upcoming" && isUpcoming) ||
        (filter === "past" && !isUpcoming);
      return matchesStatus && (!selectedDate || dateKey(interview.scheduled_at) === selectedDate);
    });

    return filtered.sort((a, b) => {
      const difference =
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      const aIsUpcoming = new Date(a.scheduled_at).getTime() >= Date.now();
      return aIsUpcoming && new Date(b.scheduled_at).getTime() >= Date.now()
        ? difference
        : -difference;
    });
  }, [filter, interviews, selectedDate]);

  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const todayKey = dateKey(new Date());
  const interviewDateKeys = useMemo(
    () => new Set(interviews.map((interview) => dateKey(interview.scheduled_at))),
    [interviews],
  );
  const dashboardPath =
    user?.role === "candidate"
      ? "/candidate-dashboard"
      : canSchedule
        ? "/dashboard"
        : "/interviewer-dashboard";

  if (loading) {
    return (
      <main className="interviews-page">
        <div className="interviews-loading" role="status">
          <span className="interviews-spinner" />
          <span>Preparing your interview workspace...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="interviews-page">
      <div className="interviews-shell">
        <header className="interviews-topbar">
          <Link
            to={dashboardPath}
            className="interviews-brand"
          >
            <span className="interviews-brand-mark">R</span>
            <span>Recruit<span>Pro</span><small>HIRING, IN FOCUS</small></span>
          </Link>
          <div className="interviews-topbar-right">
            <span className="interviews-user-role">
              {canSchedule
                ? "Hiring workspace"
                : user?.role === "interviewer"
                  ? "Interviewer workspace"
                  : "Candidate workspace"}
            </span>
            <Link
              to={dashboardPath}
              className="interviews-back-link"
            >
              <FaArrowLeft /> Dashboard
            </Link>
          </div>
        </header>

        <div className="interviews-content">
          <section className="interviews-hero">
            <div className="interviews-hero-copy">
              <span className="interviews-eyebrow">YOUR NEXT CONVERSATION</span>
              <h1>Interview schedule</h1>
              <p>
                {canSchedule
                  ? "Coordinate your shortlisted candidates and keep every conversation on track."
                  : "Your interview details, schedule and meeting links—all in one place."}
              </p>
            </div>
            <div className="interviews-hero-art" aria-hidden="true">
              <span className="interviews-art-orbit orbit-one" />
              <span className="interviews-art-orbit orbit-two" />
              <span className="interviews-art-calendar"><FaCalendarCheck /></span>
              <span className="interviews-art-clock"><FaClock /></span>
              <span className="interviews-art-spark">✦</span>
            </div>
          </section>

          <section className={`interviews-stats${canSchedule ? " is-hr" : ""}`} aria-label="Interview summary">
            <article className="interviews-stat-card">
              <span className="interviews-stat-icon mint"><FaCalendarAlt /></span>
              <span><small>Upcoming</small><strong>{upcomingInterviews.length}</strong></span>
              <span className="interviews-stat-note">Scheduled</span>
            </article>
            <article className="interviews-stat-card">
              <span className="interviews-stat-icon blue"><FaClock /></span>
              <span><small>Past interviews</small><strong>{pastInterviews.length}</strong></span>
              <span className="interviews-stat-note">History</span>
            </article>
            {canSchedule && (
              <article className="interviews-stat-card">
                <span className="interviews-stat-icon violet"><FaUserTie /></span>
                <span><small>Ready for interview</small><strong>{shortlistedApplications.length}</strong></span>
                <span className="interviews-stat-note">Shortlisted</span>
              </article>
            )}
          </section>

          {error && (
            <div className="interviews-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={loadPage}>Try again</button>
            </div>
          )}

          <div className={`interviews-workspace-grid${canSchedule ? "" : " is-candidate"}`}>
            {canSchedule && (
              <section className="interviews-panel interviews-schedule-panel">
                <div className="interviews-panel-heading">
                  <div>
                    <span className="interviews-eyebrow">NEXT STEP</span>
                    <h2>Schedule an interview</h2>
                  </div>
                  <span className="interviews-heading-icon"><FaCalendarCheck /></span>
                </div>

                {shortlistedApplications.length === 0 ? (
                  <div className="interviews-empty-schedule">
                    <span><FaUserTie /></span>
                    <strong>No candidates ready yet</strong>
                    <p>Approve an application in your HR dashboard to schedule its next round.</p>
                    <Link to="/dashboard">Review applicants <FaArrowRight /></Link>
                  </div>
                ) : (
                  <form className="interviews-form" onSubmit={handleSubmit}>
                    <label>
                      <span>Candidate and role</span>
                      <select
                        required
                        value={selectedApplicationIsShortlisted ? form.application : ""}
                        onChange={(event) =>
                          setForm({ ...form, application: event.target.value })
                        }
                      >
                        <option value="">Select a shortlisted candidate</option>
                        {shortlistedApplications.map((application) => (
                          <option key={application.id} value={application.id}>
                            {application.candidate_username} — {application.job_title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Interviewer</span>
                      <select
                        required
                        value={form.interviewer}
                        onChange={(event) =>
                          setForm({ ...form, interviewer: event.target.value })
                        }
                        disabled={interviewers.length === 0}
                      >
                        <option value="">Choose an interviewer</option>
                        {interviewers.map((interviewer) => (
                          <option key={interviewer.id} value={interviewer.id}>
                            {interviewer.first_name || interviewer.username}{" "}
                            {interviewer.last_name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="interviews-selected-date" aria-live="polite">
                      <FaCalendarAlt aria-hidden="true" />
                      <span>
                        <small>Interview date</small>
                        <strong>
                          {selectedDate
                            ? formatDate(`${selectedDate}T00:00:00`, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Select a date from the calendar"}
                        </strong>
                      </span>
                    </div>

                    <label>
                      <span>Interview time</span>
                      <input
                        type="time"
                        required
                        value={form.scheduled_time}
                        onChange={(event) =>
                          setForm({ ...form, scheduled_time: event.target.value })
                        }
                      />
                    </label>

                    <label>
                      <span>Meeting link <small>Optional</small></span>
                      <div className="interviews-input-with-icon">
                        <FaVideo aria-hidden="true" />
                        <input
                          type="url"
                          value={form.meeting_link}
                          onChange={(event) =>
                            setForm({ ...form, meeting_link: event.target.value })
                          }
                          placeholder="https://meeting-link.com"
                        />
                      </div>
                    </label>

                    {interviewers.length === 0 && (
                      <p className="interviews-form-note" role="status">
                        No interviewer accounts are available yet.
                      </p>
                    )}
                    {scheduleError && (
                      <p className="interviews-form-error" role="alert">
                        {scheduleError}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="interviews-submit"
                      disabled={submitting || !selectedDate || !form.scheduled_time || shortlistedApplications.length === 0 || interviewers.length === 0}
                    >
                      <FaCalendarCheck />
                      {submitting ? "Scheduling..." : "Confirm interview"}
                      {!submitting && <FaArrowRight />}
                    </button>
                  </form>
                )}
              </section>
            )}

            <section className="interviews-panel interviews-calendar-panel">
              <div className="interviews-panel-heading">
                <div>
                  <span className="interviews-eyebrow">PLAN AHEAD</span>
                  <h2>{canSchedule ? "Choose interview date" : "Interview calendar"}</h2>
                </div>
                {selectedDate && (
                  <button
                    type="button"
                    className="interviews-clear-date"
                    onClick={() => setSelectedDate("")}
                  >
                    Clear date
                  </button>
                )}
              </div>
              <div className="interviews-calendar-month">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}
                >
                  <FaChevronLeft />
                </button>
                <strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}
                >
                  <FaChevronRight />
                </button>
              </div>
              <div className="interviews-calendar-grid" role="grid" aria-label={canSchedule ? "Choose an interview date" : "Filter interviews by date"}>
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <span className="interviews-calendar-weekday" key={day}>{day}</span>
                ))}
                {Array.from({ length: firstWeekday }, (_, index) => (
                  <span className="interviews-calendar-blank" key={`blank-${index}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day));
                  const hasInterview = interviewDateKeys.has(key);
                  return (
                    <button
                      type="button"
                      role="gridcell"
                      key={key}
                      aria-label={`${month.toLocaleDateString(undefined, { month: "long" })} ${day}${selectedDate === key ? ", selected" : ""}${hasInterview ? ", interview scheduled" : ""}`}
                      aria-pressed={selectedDate === key}
                      className={`interviews-calendar-day${key === todayKey ? " is-today" : ""}${selectedDate === key ? " is-selected" : ""}${hasInterview ? " has-interview" : ""}`}
                      onClick={() => setSelectedDate((current) => current === key ? "" : key)}
                    >
                      {day}
                      {hasInterview && <span />}
                    </button>
                  );
                })}
              </div>
              <div className="interviews-calendar-legend">
                <span><i /> Interview scheduled</span>
                <span><i className="today-dot" /> Today</span>
              </div>
              <div className="interviews-calendar-tip">
                <FaInfoCircle />
                <span>
                  {canSchedule
                    ? "Select a date here to schedule an interview; select a date with a dot to review existing interviews."
                    : "Select a date to filter your interview list."}
                </span>
              </div>
            </section>
          </div>

          <section className="interviews-panel interviews-list-panel">
            <div className="interviews-list-heading">
              <div>
                <span className="interviews-eyebrow">YOUR HIRING CALENDAR</span>
                <h2>{selectedDate ? formatDate(`${selectedDate}T00:00:00`, { month: "long", day: "numeric" }) : "Your interviews"}</h2>
              </div>
              <div className="interviews-filter-tabs" role="group" aria-label="Filter interview list">
                {[
                  ["upcoming", "Upcoming"],
                  ["past", "Past"],
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
                    {value === "upcoming" && <span>{upcomingInterviews.length}</span>}
                  </button>
                ))}
              </div>
            </div>

            {visibleInterviews.length === 0 ? (
              <div className="interviews-empty-list">
                <span><FaCalendarAlt /></span>
                <strong>
                  {selectedDate
                    ? "No interviews on this date"
                    : filter === "upcoming"
                      ? "Nothing scheduled just yet"
                      : "No interviews to show"}
                </strong>
                <p>
                  {selectedDate
                    ? "Choose another day or clear the date filter to see your full schedule."
                    : canSchedule && shortlistedApplications.length > 0
                      ? "Schedule a conversation with one of your shortlisted candidates."
                      : "Your scheduled interviews will appear here."}
                </p>
                {selectedDate && (
                  <button type="button" onClick={() => setSelectedDate("")}>Show all dates</button>
                )}
              </div>
            ) : (
              <div className="interviews-list">
                {visibleInterviews.map((interview) => {
                  const date = new Date(interview.scheduled_at);
                  const isUpdating = updatingInterviewId === interview.id;
                  return (
                    <article className="interview-card" key={interview.id}>
                      <div className="interview-date-block">
                        <span>{formatDate(interview.scheduled_at, { month: "short" })}</span>
                        <strong>{Number.isNaN(date.getTime()) ? "—" : date.getDate()}</strong>
                        <span>{formatDate(interview.scheduled_at, { weekday: "short" })}</span>
                      </div>
                      <div className="interview-card-main">
                        <div className="interview-card-title-row">
                          <h3>{interview.job_title || "Interview"}</h3>
                          <span className={`interview-status status-${String(interview.status).toLowerCase()}`}>
                            <i />{interview.status}
                          </span>
                        </div>
                        <div className="interview-card-meta">
                          {user?.role !== "candidate" && (
                            <span><FaUserTie /> Candidate: {interview.candidate_username || "Candidate"}</span>
                          )}
                          {user?.role === "candidate" && (
                            <span><FaUserTie /> Interviewer: {interview.interviewer_username || "Hiring team"}</span>
                          )}
                          {canSchedule && (
                            <span><FaBriefcase /> Interviewer: {interview.interviewer_username || "Interviewer"}</span>
                          )}
                          <span><FaClock /> {formatTime(interview.scheduled_at)}</span>
                        </div>
                        {user?.role === "interviewer" && interview.candidate_name && (
                          <section className="interview-candidate-details" aria-label="Assigned candidate details">
                            <span className="interview-candidate-details-title">Candidate details</span>
                            <div className="interview-candidate-contact">
                              <strong>{interview.candidate_name}</strong>
                              {interview.candidate_email && (
                                <span><FaEnvelope /> {interview.candidate_email}</span>
                              )}
                              {interview.application_applied_at && (
                                <span>
                                  Applied {formatDate(interview.application_applied_at, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                            {interview.candidate_cover_letter && (
                              <p className="interview-candidate-cover-letter">
                                {interview.candidate_cover_letter}
                              </p>
                            )}
                            {interview.candidate_resume_available ? (
                              <button
                                type="button"
                                className="interview-resume-button"
                                onClick={() => downloadCandidateResume(interview.id)}
                              >
                                <FaFileAlt /> Download candidate resume
                              </button>
                            ) : (
                              <span className="interview-resume-missing">No resume was attached to this application.</span>
                            )}
                          </section>
                        )}
                        {interview.meeting_link && (
                          <a
                            className="interview-meeting-link"
                            href={interview.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FaVideo /> Join meeting <FaExternalLinkAlt />
                          </a>
                        )}
                      </div>
                      {canSchedule && interview.status === "Scheduled" && (
                        <div className="interview-card-actions">
                          <button
                            type="button"
                            className="interview-complete-button"
                            disabled={isUpdating}
                            onClick={() => updateStatus(interview.id, "Completed")}
                          >
                            <FaCheck /> Complete
                          </button>
                          <button
                            type="button"
                            className="interview-cancel-button"
                            disabled={isUpdating}
                            onClick={() => updateStatus(interview.id, "Cancelled")}
                          >
                            <FaTimes /> Cancel
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          <footer className="interviews-footer">
            <span><span className="interviews-brand-mark">R</span> Recruit<span>Pro</span></span>
            <span>Keep every conversation moving forward.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}

export default Interviews;
