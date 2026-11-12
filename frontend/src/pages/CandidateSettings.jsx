import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBell,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";
import api from "../services/api";
import "../styles/CandidateSettings.css";

const SETTINGS_BY_ROLE = {
  candidate: {
    label: "Candidate",
    dashboardPath: "/candidate-dashboard",
    profilePath: "/candidate/profile",
    profileDescription: "Update the details employers see on your candidate profile.",
    notificationsDescription: "Review interview updates and activity from your applications.",
  },
  hr: {
    label: "Recruiter",
    dashboardPath: "/dashboard",
    profilePath: "/hr/profile",
    profileDescription: "Update your recruiter details, experience, and hiring focus.",
    notificationsDescription: "Review candidate and interview updates for your hiring work.",
  },
  admin: {
    label: "Recruiter",
    dashboardPath: "/dashboard",
    profilePath: "/hr/profile",
    profileDescription: "Update your recruiter details, experience, and hiring focus.",
    notificationsDescription: "Review candidate and interview updates for your hiring work.",
  },
  interviewer: {
    label: "Interviewer",
    dashboardPath: "/interviewer-dashboard",
    profilePath: "/interviewer/profile",
    profileDescription: "Update your interviewer profile and interview expertise.",
    notificationsDescription: "Review interview assignments and workspace updates.",
  },
};

const createSettingsItems = (config) => [
  {
    icon: FaUser,
    title: "Profile information",
    description: config.profileDescription,
    action: "Edit profile",
    path: config.profilePath,
  },
  {
    icon: FaLock,
    title: "Password and sign-in",
    description: "Request a secure password reset link for your account.",
    action: "Reset password",
    path: "/forgot-password",
    withEmail: true,
  },
  {
    icon: FaBell,
    title: "Notifications",
    description: config.notificationsDescription,
    action: "Open notifications",
    path: "/notifications",
  },
  {
    icon: FaEnvelope,
    title: "Contact support",
    description: "Send our team a message if you need help with your account.",
    action: "Get support",
    path: "/contact",
  },
];

function CandidateSettings() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loadError, setLoadError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    api.get("/accounts/me/")
      .then(({ data }) => {
        if (active) {
          setEmail(data.email);
          setRole(data.role);
        }
      })
      .catch((error) => {
        console.error("Could not load candidate account settings:", error);
        if (active) setLoadError("Account details could not be loaded.");
      });

    return () => {
      active = false;
    };
  }, []);

  const settings = SETTINGS_BY_ROLE[role];
  const dashboardPath = settings?.dashboardPath || "/candidate-dashboard";
  const settingsItems = settings ? createSettingsItems(settings) : [];

  return (
    <main className="candidate-settings-page">
      <header className="candidate-settings-topbar">
        <button type="button" onClick={() => navigate(dashboardPath)}>
          <FaArrowLeft aria-hidden="true" />
          Back to dashboard
        </button>
        <span>{settings?.label || "RecruitPro"} workspace</span>
      </header>

      <div className="candidate-settings-content">
        <div className="candidate-settings-heading">
          <span className="candidate-settings-eyebrow">ACCOUNT PREFERENCES</span>
          <h1>Settings</h1>
          <p>
            Manage your {settings?.label.toLowerCase() || "RecruitPro"} account,
            security, and workspace updates.
          </p>
        </div>

        <section className="candidate-settings-account" aria-label="Account email">
          <span className="candidate-settings-account-icon">
            <FaShieldAlt aria-hidden="true" />
          </span>
          <span>
            <strong>RecruitPro account</strong>
            <small>{loadError || email || (role ? "Email address unavailable." : "Loading account details...")}</small>
          </span>
          <span className="candidate-settings-secure">
            {settings ? `${settings.label} account` : ""}
          </span>
        </section>

        <section className="candidate-settings-list" aria-label="Account settings">
          {settingsItems.map((item) => {
            const ItemIcon = item.icon;
            return (
              <article className="candidate-settings-card" key={item.title}>
                <span className="candidate-settings-card-icon">
                  <ItemIcon aria-hidden="true" />
                </span>
                <div className="candidate-settings-card-copy">
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      item.path,
                      item.withEmail && email ? { state: { email } } : undefined,
                    )
                  }
                >
                  {item.action}
                  <FaArrowRight aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

export default CandidateSettings;
