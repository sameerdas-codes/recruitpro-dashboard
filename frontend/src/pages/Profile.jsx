import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBriefcase,
  FaCamera,
  FaCheck,
  FaEnvelope,
  FaFilePdf,
  FaGraduationCap,
  FaLock,
  FaMapMarkerAlt,
  FaPhone,
  FaRedo,
  FaSave,
  FaShieldAlt,
  FaSlidersH,
  FaUser,
  FaUserTag,
  FaWrench,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../services/api";
import "../styles/Profile.css";

const PROFILE_CONFIG = {
  candidate: {
    path: "/candidate/profile",
    dashboardPath: "/candidate-dashboard",
    eyebrow: "CANDIDATE CAREER PROFILE",
    title: "Build your candidate profile",
    description: "Present your experience and career goals to prospective employers.",
    personalHeading: "Your professional story",
    personalDescription: "Help employers understand who you are and what you bring.",
    experienceLabel: "Work experience",
    experienceDescription: "Showcase your roles, responsibilities, and achievements.",
    focusLabel: "Career preferences",
    focusHeading: "Skills & career preferences",
    focusDescription: "Highlight your strengths and the opportunities you want next.",
    focusHint: "Role, work arrangement, schedule, or areas of interest",
    focusPlaceholder: "Remote or hybrid work, preferred roles, industries, or other career preferences.",
    tabs: [
      { id: "personal", label: "Personal info", icon: FaUser },
      { id: "education", label: "Education", icon: FaGraduationCap },
      { id: "experience", label: "Experience", icon: FaBriefcase },
      { id: "focus", label: "Career preferences", icon: FaWrench },
      { id: "resume", label: "Resume", icon: FaFilePdf },
    ],
  },
  hr: {
    path: "/hr/profile",
    dashboardPath: "/dashboard",
    eyebrow: "RECRUITER ACCOUNT",
    title: "Your recruiter profile",
    description: "Keep your professional details current for a trusted hiring workspace.",
    personalHeading: "Recruiter information",
    personalDescription: "Set up the profile candidates and your hiring team can recognize.",
    experienceLabel: "Recruiting experience",
    experienceDescription: "Describe your hiring background, roles, and accomplishments.",
    focusLabel: "Hiring focus",
    focusHeading: "Hiring expertise & focus",
    focusDescription: "Share the roles, teams, and recruiting areas you work with.",
    focusHint: "Hiring specialties, industries, role types, or team priorities",
    focusPlaceholder: "Engineering hiring, product roles, high-volume recruiting, or other hiring priorities.",
    tabs: [
      { id: "personal", label: "Recruiter details", icon: FaUser },
      { id: "experience", label: "Experience", icon: FaBriefcase },
      { id: "focus", label: "Hiring focus", icon: FaWrench },
    ],
  },
  interviewer: {
    path: "/interviewer/profile",
    dashboardPath: "/interviewer-dashboard",
    eyebrow: "INTERVIEWER ACCOUNT",
    title: "Your interviewer profile",
    description: "Make your background and interview expertise clear to the hiring team.",
    personalHeading: "Interviewer information",
    personalDescription: "Keep your identity and contact information up to date.",
    experienceLabel: "Professional experience",
    experienceDescription: "Add relevant roles and experience assessing candidates.",
    focusLabel: "Interview expertise",
    focusHeading: "Skills & interview expertise",
    focusDescription: "Tell the team which competencies and interview areas you cover.",
    focusHint: "Technical domains, competencies, or interview formats",
    focusPlaceholder: "Frontend engineering, system design, behavioral interviews, or other areas of expertise.",
    tabs: [
      { id: "personal", label: "Personal info", icon: FaUser },
      { id: "experience", label: "Experience", icon: FaBriefcase },
      { id: "focus", label: "Interview expertise", icon: FaWrench },
    ],
  },
};

const createProfileForm = (user) => ({
  first_name: user.first_name || "",
  last_name: user.last_name || "",
  email: user.email || "",
  phone_number: user.phone_number || "",
  location: user.location || "",
  professional_title: user.professional_title || "",
  about: user.about || "",
  education: user.education || "",
  experience: user.experience || "",
  skills: user.skills || "",
  preferences: user.preferences || "",
});

const getDisplayName = (user) =>
  [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;

const getProfileError = (error) => {
  const data = error.response?.data;
  if (!data) return "Could not save your profile. Check your connection and try again.";
  if (typeof data.detail === "string") return data.detail;
  return "Please check your details and try again.";
};

function Profile({ profileRole }) {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("personal");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [removeResume, setRemoveResume] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    api
      .get("/accounts/me/")
      .then((response) => {
        if (active) {
          setUser(response.data);
          setForm(createProfileForm(response.data));
          setPhotoPreview(response.data.profile_picture || "");
        }
      })
      .catch((loadError) => {
        console.error("Error loading profile:", loadError);
        if (active) setError("Profile could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!photoFile) return undefined;
    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  const profileConfig = profileRole ? PROFILE_CONFIG[profileRole] : null;

  useEffect(() => {
    if (user && !profileRole) {
      navigate(PROFILE_CONFIG[user.role]?.path || PROFILE_CONFIG.hr.path, {
        replace: true,
      });
    }
  }, [navigate, profileRole, user]);

  const dashboardPath = profileConfig?.dashboardPath || "/dashboard";

  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    const fields = [
      user.first_name,
      user.last_name,
      user.email,
      user.profile_picture,
      user.default_resume,
      user.phone_number,
      user.location,
      user.professional_title,
      user.about,
      user.experience,
      user.skills,
      user.preferences,
      ...(user.role === "candidate" ? [user.education] : []),
    ];
    return Math.round(
      (fields.filter((value) => Boolean(String(value || "").trim())).length /
        fields.length) *
        100,
    );
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setError("");
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Profile photo must be 2 MB or smaller.");
      return;
    }
    setError("");
    setPhotoFile(file);
    setRemovePhoto(false);
    setFieldErrors((current) => ({ ...current, profile_picture: "" }));
  };

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setFieldErrors((current) => ({ ...current, default_resume: "Choose a PDF resume." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((current) => ({ ...current, default_resume: "Resume size must be 5 MB or smaller." }));
      return;
    }
    setFieldErrors((current) => ({ ...current, default_resume: "" }));
    setResumeFile(file);
    setRemoveResume(false);
    setError("");
  };

  const resetChanges = () => {
    setForm(createProfileForm(user));
    setPhotoFile(null);
    setPhotoPreview(user.profile_picture || "");
    setRemovePhoto(false);
    setResumeFile(null);
    setRemoveResume(false);
    setFieldErrors({});
    setError("");
  };

  const removeProfilePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setRemovePhoto(true);
    setFieldErrors((current) => ({ ...current, profile_picture: "" }));
  };

  const removeProfileResume = () => {
    setResumeFile(null);
    setRemoveResume(true);
    setFieldErrors((current) => ({ ...current, default_resume: "" }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});

    const payload = new FormData();
    Object.entries(form).forEach(([field, value]) => {
      payload.append(field, value.trim());
    });
    if (photoFile) payload.append("profile_picture", photoFile);
    if (removePhoto) payload.append("remove_profile_picture", "true");
    if (profileRole === "candidate" && resumeFile) {
      payload.append("default_resume", resumeFile);
    }
    if (profileRole === "candidate" && removeResume) {
      payload.append("remove_default_resume", "true");
    }

    try {
      const response = await api.patch("/accounts/me/", payload);
      setUser(response.data);
      setForm(createProfileForm(response.data));
      setPhotoFile(null);
      setPhotoPreview(response.data.profile_picture || "");
      setRemovePhoto(false);
      setResumeFile(null);
      setRemoveResume(false);
      toast.success("Profile updated successfully.");
    } catch (saveError) {
      console.error("Error saving profile:", saveError);
      if (saveError.response?.data && typeof saveError.response.data === "object") {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(saveError.response.data).map(([field, messages]) => [
              field,
              Array.isArray(messages) ? messages[0] : messages,
            ]),
          ),
        );
      }
      setError(getProfileError(saveError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="profile-page" role="status">
        <div className="profile-loading">Loading your profile...</div>
      </main>
    );
  }

  if (!user || !form) {
    return (
      <main className="profile-page">
        <section className="profile-error-card" role="alert">
          <h1>Profile unavailable</h1>
          <p>{error || "Profile could not be loaded."}</p>
          <button type="button" onClick={() => navigate("/login")}>Return to login</button>
        </section>
      </main>
    );
  }

  const displayName = getDisplayName(user);
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const title = user.professional_title || user.role;
  const config = PROFILE_CONFIG[profileRole] || PROFILE_CONFIG.hr;

  if (!profileRole) {
    return (
      <main className="profile-page" role="status">
        <div className="profile-loading">Opening your role-specific profile...</div>
      </main>
    );
  }

  return (
    <main className={`profile-page profile-role-${profileRole}`}>
      <div className="profile-shell">
        <header className="profile-topbar">
          <button type="button" onClick={() => navigate(dashboardPath)}>
            <FaArrowLeft /> Back to dashboard
          </button>
          <span className="profile-brand"><span>R</span> Recruit<span>Pro</span></span>
          <button type="button" className="profile-topbar-user" onClick={() => navigate(dashboardPath)}>
            <span className="profile-topbar-avatar">
              {photoPreview ? <img src={photoPreview} alt="" /> : initials.slice(0, 1)}
            </span>
            <span>{displayName}</span>
          </button>
        </header>

        <div className="profile-content">
          <section className="profile-hero">
            <div className="profile-hero-icon"><FaUser /></div>
            <div>
              <span className="profile-eyebrow">{config.eyebrow}</span>
              <h1>{config.title}</h1>
              <p>{config.description}</p>
            </div>
            <span className="profile-hero-caption">A stronger profile,<br />a clearer next step.</span>
          </section>

          {error && <p className="profile-form-error" role="alert">{error}</p>}

          <form className="profile-layout" onSubmit={saveProfile}>
            <aside className="profile-side-column">
              <section className="profile-card profile-account-card">
                <div className="profile-user-summary">
                  <div className="profile-photo-wrap">
                    <span className="profile-user-avatar">
                      {photoPreview ? <img src={photoPreview} alt={`${displayName} profile`} /> : initials}
                    </span>
                    <label className="profile-photo-button" title="Upload profile photo">
                      <FaCamera />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-label="Upload profile photo"
                        onChange={handlePhotoChange}
                      />
                    </label>
                  </div>
                  <strong>{displayName}</strong>
                  <span className="profile-role-badge"><FaUserTag /> {title}</span>
                  {photoPreview && (
                    <button type="button" className="profile-remove-photo" onClick={removeProfilePhoto}>
                      Remove photo
                    </button>
                  )}
                  {fieldErrors.profile_picture && <span className="profile-field-error">{fieldErrors.profile_picture}</span>}
                </div>
                <div className="profile-completion">
                  <div><strong>Profile completeness</strong><span>{profileCompletion}%</span></div>
                  <span className="profile-progress-track"><i style={{ width: `${profileCompletion}%` }} /></span>
                  <p>{profileCompletion === 100 ? "Your profile is complete." : "Add a few more details to complete your profile."}</p>
                </div>
                <div className="profile-contact-summary">
                  <span><FaEnvelope />{user.email}</span>
                  {user.phone_number && <span><FaPhone />{user.phone_number}</span>}
                  {user.location && <span><FaMapMarkerAlt />{user.location}</span>}
                </div>
              </section>

              <section className="profile-card profile-security-card">
                <span className="profile-security-icon"><FaShieldAlt /></span>
                <div><h2>Account security</h2><p>Keep your account safe with a strong password.</p></div>
                <button type="button" onClick={() => navigate("/forgot-password", { state: { email: user.email } })}>
                  <FaLock /> Reset password
                </button>
              </section>
            </aside>

            <section className="profile-card profile-details-card">
              <nav className="profile-tabs" aria-label="Profile sections">
                {config.tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      type="button"
                      key={tab.id}
                      className={activeTab === tab.id ? "is-active" : ""}
                      aria-current={activeTab === tab.id ? "page" : undefined}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <TabIcon /> <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {activeTab === "personal" && (
                <section className="profile-tab-content">
                  <div className="profile-section-heading">
                    <span><FaUser /></span>
                    <div><h2>{config.personalHeading}</h2><p>{config.personalDescription}</p></div>
                  </div>
                  <div className="profile-form-grid">
                    <label>
                      First name
                      <input name="first_name" autoComplete="given-name" maxLength="150" value={form.first_name} onChange={handleChange} required />
                      {fieldErrors.first_name && <span className="profile-field-error">{fieldErrors.first_name}</span>}
                    </label>
                    <label>
                      Last name
                      <input name="last_name" autoComplete="family-name" maxLength="150" value={form.last_name} onChange={handleChange} />
                      {fieldErrors.last_name && <span className="profile-field-error">{fieldErrors.last_name}</span>}
                    </label>
                    <label>
                      Email address
                      <input name="email" type="email" autoComplete="email" required maxLength="254" value={form.email} onChange={handleChange} />
                      {fieldErrors.email && <span className="profile-field-error">{fieldErrors.email}</span>}
                    </label>
                    <label>
                      Phone number
                      <input name="phone_number" type="tel" autoComplete="tel" maxLength="30" value={form.phone_number} onChange={handleChange} placeholder="+1 555 123 4567" />
                      {fieldErrors.phone_number && <span className="profile-field-error">{fieldErrors.phone_number}</span>}
                    </label>
                    <label>
                      Location
                      <span className="profile-input-icon"><FaMapMarkerAlt /><input name="location" autoComplete="address-level2" maxLength="120" value={form.location} onChange={handleChange} placeholder="City, country" /></span>
                      {fieldErrors.location && <span className="profile-field-error">{fieldErrors.location}</span>}
                    </label>
                    <label>
                      {profileRole === "hr" ? "Recruiting title" : profileRole === "interviewer" ? "Interviewing title" : "Professional title"}
                      <span className="profile-input-icon"><FaBriefcase /><input name="professional_title" maxLength="120" value={form.professional_title} onChange={handleChange} placeholder={profileRole === "candidate" ? "e.g. Frontend Developer" : profileRole === "interviewer" ? "e.g. Senior Engineering Interviewer" : "e.g. Talent Acquisition Partner"} /></span>
                      {fieldErrors.professional_title && <span className="profile-field-error">{fieldErrors.professional_title}</span>}
                    </label>
                    <label className="profile-form-full">
                      {profileRole === "candidate" ? "Professional summary" : profileRole === "hr" ? "Recruiter introduction" : "Interviewer introduction"}
                      <textarea name="about" rows="4" maxLength="500" value={form.about} onChange={handleChange} placeholder={profileRole === "candidate" ? "Summarize your experience, strengths, and the work you want to do." : profileRole === "hr" ? "Introduce your recruiting background and the teams you support." : "Introduce your professional background and interviewing approach."} />
                      <span className="profile-character-count">{form.about.length}/500</span>
                      {fieldErrors.about && <span className="profile-field-error">{fieldErrors.about}</span>}
                    </label>
                  </div>
                </section>
              )}

              {activeTab === "education" && profileRole === "candidate" && (
                <section className="profile-tab-content">
                  <div className="profile-section-heading">
                    <span><FaGraduationCap /></span>
                    <div><h2>Education</h2><p>Add your degrees, institutions, and relevant training.</p></div>
                  </div>
                  <label className="profile-textarea-label">
                    Education history
                    <textarea name="education" rows="8" maxLength="1500" value={form.education} onChange={handleChange} placeholder={"B.Sc. Computer Science\nExample University · 2020–2024\nRelevant coursework, honors, or certifications"} />
                    <span className="profile-character-count">{form.education.length}/1500</span>
                    {fieldErrors.education && <span className="profile-field-error">{fieldErrors.education}</span>}
                  </label>
                </section>
              )}

              {activeTab === "resume" && profileRole === "candidate" && (
                <section className="profile-tab-content">
                  <div className="profile-section-heading">
                    <span><FaFilePdf /></span>
                    <div><h2>Your default resume</h2><p>This resume will be selected automatically when you apply for a job. You can choose a different resume for any application.</p></div>
                  </div>
                  <div className="profile-resume-card">
                    <FaFilePdf />
                    <div>
                      <strong>{resumeFile?.name || (removeResume ? "No resume selected" : user.default_resume ? decodeURIComponent(user.default_resume.split("/").pop()) : "No default resume uploaded")}</strong>
                      <span>PDF file · up to 5 MB</span>
                    </div>
                    <label className="profile-upload-button">
                      {user.default_resume || resumeFile ? "Replace resume" : "Choose resume"}
                      <input type="file" accept=".pdf,application/pdf" onChange={handleResumeChange} />
                    </label>
                    {user.default_resume && !removeResume && !resumeFile && (
                      <button type="button" className="profile-remove-resume" onClick={removeProfileResume}>Remove</button>
                    )}
                  </div>
                  {fieldErrors.default_resume && <span className="profile-field-error">{fieldErrors.default_resume}</span>}
                </section>
              )}

              {activeTab === "experience" && (
                <section className="profile-tab-content">
                  <div className="profile-section-heading">
                    <span><FaBriefcase /></span>
                    <div><h2>{profileRole === "hr" ? "Recruiting experience" : profileRole === "interviewer" ? "Professional experience" : "Work experience"}</h2><p>{config.experienceDescription}</p></div>
                  </div>
                  <label className="profile-textarea-label">
                    {config.experienceLabel}
                    <textarea name="experience" rows="8" maxLength="1500" value={form.experience} onChange={handleChange} placeholder={profileRole === "candidate" ? "Job title · Company\nMonth Year – Month Year\nKey responsibilities and measurable achievements" : profileRole === "hr" ? "Recruiting role · Company\nMonth Year – Month Year\nTeams supported, hiring scope, and outcomes" : "Professional role · Company\nMonth Year – Month Year\nRelevant work and candidate assessment experience"} />
                    <span className="profile-character-count">{form.experience.length}/1500</span>
                    {fieldErrors.experience && <span className="profile-field-error">{fieldErrors.experience}</span>}
                  </label>
                </section>
              )}

              {activeTab === "focus" && (
                <section className="profile-tab-content">
                  <div className="profile-section-heading">
                    <span><FaWrench /></span>
                    <div><h2>{config.focusHeading}</h2><p>{config.focusDescription}</p></div>
                  </div>
                  <div className="profile-form-grid">
                    <label className="profile-form-full">
                      {profileRole === "candidate" ? "Core skills" : profileRole === "hr" ? "Recruiting specialties" : "Interview competencies"}
                      <textarea name="skills" rows="3" maxLength="500" value={form.skills} onChange={handleChange} placeholder={profileRole === "candidate" ? "React, project management, communication..." : profileRole === "hr" ? "Technical recruiting, executive search, talent sourcing..." : "Frontend engineering, system design, behavioral interviewing..."} />
                      <span className="profile-character-count">{form.skills.length}/500</span>
                      {fieldErrors.skills && <span className="profile-field-error">{fieldErrors.skills}</span>}
                    </label>
                    <label className="profile-form-full">
                      {config.focusLabel}
                      <span className="profile-label-hint">{config.focusHint}</span>
                      <textarea name="preferences" rows="5" maxLength="1000" value={form.preferences} onChange={handleChange} placeholder={config.focusPlaceholder} />
                      <span className="profile-character-count">{form.preferences.length}/1000</span>
                      {fieldErrors.preferences && <span className="profile-field-error">{fieldErrors.preferences}</span>}
                    </label>
                    <div className="profile-form-full profile-photo-upload">
                      <span className="profile-photo-upload-icon"><FaCamera /></span>
                      <div><strong>Profile photo</strong><span>JPG, PNG, or WebP · up to 2 MB</span></div>
                      <label className="profile-upload-button">Choose photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} /></label>
                    </div>
                  </div>
                </section>
              )}

              <div className="profile-form-actions">
                <button type="button" className="profile-cancel-button" disabled={saving} onClick={resetChanges}>
                  <FaRedo /> Reset changes
                </button>
                <button type="submit" className="profile-save-button" disabled={saving}>
                  {saving ? <FaCheck /> : <FaSave />} {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </section>
          </form>

          <div className="profile-email-note"><FaSlidersH /> Your profile details are kept with your account and used only in the relevant RecruitPro workflows.</div>
        </div>
      </div>
    </main>
  );
}

export default Profile;
