import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaArrowLeft,
  FaEnvelope,
  FaHome,
  FaLifeRing,
  FaRegClock,
} from "react-icons/fa";
import api from "../services/api";
import "../styles/CompanyPages.css";
import "../styles/ContactSupport.css";

const SUPPORT_EMAIL = "recruitpro4401@gmail.com";

function Contact({ standalone = false }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [dashboardPath, setDashboardPath] = useState("/");
  const [roleLabel, setRoleLabel] = useState("Guest");
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("access_token")) return;

    let active = true;
    api.get("/accounts/me/")
      .then(({ data }) => {
        if (!active) return;
        const roleRoutes = {
          candidate: ["/candidate-dashboard", "Candidate"],
          hr: ["/dashboard", "Recruiter"],
          admin: ["/dashboard", "Recruiter"],
          interviewer: ["/interviewer-dashboard", "Interviewer"],
        };
        const [path, label] = roleRoutes[data.role] || ["/", "Member"];
        setDashboardPath(path);
        setRoleLabel(label);
      })
      .catch((error) => {
        console.error("Could not load support page account:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);
    setSubmitted(false);
    setSubmitError("");

    try {
      await api.post("/accounts/contact-support/", {
        name: formData.get("name"),
        email: formData.get("email"),
        topic: formData.get("topic"),
        message: formData.get("message"),
      });
      setSubmitted(true);
      form.reset();
    } catch (error) {
      console.error("Could not send support request:", error);
      const responseMessage = error.response?.data?.detail;
      setSubmitError(
        typeof responseMessage === "string"
          ? responseMessage
          : error.response?.status === 503
            ? "Our email service is not configured yet. Please email us directly."
            : "We could not send your message. Please try again later.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const contactSection = (
    <section id="contact" className="company-contact-section">
      <div className="company-section-inner contact-page-layout support-page-layout">
        <header className="contact-page-heading">
          <div>
            <span className="home-section-kicker">CONTACT RECRUITPRO</span>
            <h1>How can we help?</h1>
            <p>
              Questions about your account or hiring workflow? Send us a message
              and we’ll help you find the right next step.
            </p>
          </div>
          <a className="contact-email-link" href={`mailto:${SUPPORT_EMAIL}`}>
            <FaEnvelope aria-hidden="true" />
            {SUPPORT_EMAIL}
          </a>
        </header>

        <div className="contact-content-grid">
          <aside className="contact-page-details">
            <div className="contact-hero-card">
              <span className="contact-hero-icon"><FaLifeRing /></span>
              <span className="home-section-kicker">HERE FOR YOUR TEAM</span>
              <h2>Let’s find the right next step.</h2>
              <p>Tell us what you need help with and include any useful context.</p>
              <div className="contact-availability">
                <FaRegClock />
                <span>Send us a message anytime</span>
              </div>
            </div>
            <div className="contact-direct-card">
              <span><FaEnvelope /></span>
              <div>
                <strong>Prefer email?</strong>
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              </div>
            </div>
            <div className="contact-direct-card">
              <span><FaLifeRing /></span>
              <div>
                <strong>Already have an account?</strong>
                <p>Sign in to open your RecruitPro workspace.</p>
                <Link to="/login">Go to sign in <FaArrowRight /></Link>
              </div>
            </div>
          </aside>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form-heading">
              <h2>Get in touch</h2>
              <p>Fields marked with <span>*</span> are required.</p>
            </div>
            <div className="contact-form-fields">
              <label>
                Your name <span>*</span>
                <input name="name" type="text" autoComplete="name" maxLength="120" placeholder="How should we address you?" required />
              </label>
              <label>
                Email address <span>*</span>
                <input name="email" type="email" autoComplete="email" maxLength="254" placeholder="you@company.com" required />
              </label>
              <label className="contact-form-full">
                What can we help with? <span>*</span>
                <select name="topic" defaultValue="" required>
                  <option value="" disabled>Select a topic</option>
                  <option value="Product question">Product question</option>
                  <option value="Account help">Account help</option>
                  <option value="Hiring workflow">Hiring workflow</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className="contact-form-full">
                Message <span>*</span>
                <textarea name="message" rows="4" maxLength="3000" placeholder="Share a few details so we can point you in the right direction." required />
              </label>
            </div>
            {submitted && (
              <p className="contact-form-notice" role="status">
                Your request was sent to our support inbox. Our team can reply
                directly to the email address you provided.
              </p>
            )}
            {submitError && (
              <p className="contact-form-error" role="alert">
                {submitError} Please email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
              </p>
            )}
            <button
              type="submit"
              className="home-button home-button-primary contact-submit"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send message"}
              {!submitting && <FaArrowRight aria-hidden="true" />}
            </button>
            <p className="contact-privacy-note">
              Please don’t include passwords or other sensitive account information.
            </p>
          </form>
        </div>
      </div>
    </section>
  );

  if (!standalone) return contactSection;

  return (
    <div className="support-workspace">
      <aside className="support-sidebar">
        <button
          type="button"
          className="support-brand"
          onClick={() => navigate(dashboardPath)}
          aria-label="Return to dashboard"
        >
          <span className="support-brand-mark">R</span>
          <span>Recruit<span>Pro</span><small>SUPPORT CENTER</small></span>
        </button>
        <div className="support-sidebar-section">
          <span className="support-sidebar-label">WORKSPACE</span>
          <button
            type="button"
            className="support-sidebar-link"
            onClick={() => navigate(dashboardPath)}
          >
            <FaHome aria-hidden="true" />
            <span>Back to dashboard</span>
          </button>
          <button
            type="button"
            className="support-sidebar-link is-active"
            aria-current="page"
          >
            <FaLifeRing aria-hidden="true" />
            <span>Contact support</span>
          </button>
        </div>
        <div className="support-sidebar-bottom">
          <span className="support-user-avatar">{roleLabel.slice(0, 1)}</span>
          <span><strong>{roleLabel}</strong><small>RecruitPro workspace</small></span>
        </div>
      </aside>
      <main className="support-main">
        <header className="support-topbar">
          <button
            type="button"
            className="support-mobile-back"
            onClick={() => navigate(dashboardPath)}
          >
            <FaArrowLeft aria-hidden="true" />
            Dashboard
          </button>
          <span>Support center <FaArrowRight aria-hidden="true" /> Contact</span>
          <span className="support-topbar-role">{roleLabel} workspace</span>
        </header>
        {contactSection}
      </main>
    </div>
  );
}

export default Contact;
