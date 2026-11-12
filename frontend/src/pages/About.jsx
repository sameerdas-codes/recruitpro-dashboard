import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBell,
  FaBriefcase,
  FaCalendarCheck,
  FaCheck,
  FaCompass,
  FaUsers,
} from "react-icons/fa";
import "../styles/CompanyPages.css";

const principles = [
  {
    icon: FaCompass,
    title: "Clarity",
    description: "See the next step without losing the context.",
  },
  {
    icon: FaUsers,
    title: "People first",
    description: "A thoughtful experience for candidates and teams.",
  },
  {
    icon: FaCheck,
    title: "Less busywork",
    description: "Keep hiring details organized in one workspace.",
  },
];

const workflow = [
  { icon: FaBriefcase, label: "Create roles" },
  { icon: FaUsers, label: "Review people" },
  { icon: FaCalendarCheck, label: "Meet together" },
  { icon: FaBell, label: "Stay informed" },
];

function About() {
  return (
    <section id="about" className="company-about-section">
      <div className="company-section-inner about-page-layout">
        <header className="company-page-heading">
          <span className="home-section-kicker">ABOUT RECRUITPRO</span>
          <h1>Hiring works better when every step is in focus.</h1>
          <p>
            One connected workspace for job management, candidate applications,
            and interview coordination—built to help people move forward with clarity.
          </p>
          <Link to="/register" className="home-button home-button-primary">
            Get started <FaArrowRight aria-hidden="true" />
          </Link>
        </header>

        <div className="about-page-story">
          <div className="about-visual" aria-hidden="true">
            <div className="about-visual-orbit orbit-one" />
            <div className="about-visual-orbit orbit-two" />
            <div className="about-visual-center">
              <span className="about-visual-mark">R</span>
              <strong>People first.</strong>
              <small>Progress, together.</small>
            </div>
            <span className="about-float-card about-float-jobs"><FaBriefcase /> Roles</span>
            <span className="about-float-card about-float-people"><FaUsers /> People</span>
            <span className="about-float-card about-float-interviews"><FaCalendarCheck /> Conversations</span>
          </div>
          <div className="about-story-copy">
            <span className="home-section-kicker">WHY RECRUITPRO</span>
            <h2>Less scattered work.<br /><span>More meaningful progress.</span></h2>
            <p>
              From sharing an opportunity to planning the next conversation,
              keep the important moments connected and the right people informed.
            </p>
          </div>
        </div>

        <div className="about-principles">
          <div className="about-principles-heading">
            <span className="home-section-kicker">WHAT GUIDES US</span>
            <h2>A more considered way to hire</h2>
          </div>
          <div className="company-principles-grid">
            {principles.map(({ icon: Icon, title, description }) => (
              <article className="company-principle-card" key={title}>
                <span className="about-principle-icon"><Icon aria-hidden="true" /></span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </article>
            ))}
          </div>
        </div>

        <div className="about-workflow">
          <span className="home-section-kicker">ONE CONNECTED WORKFLOW</span>
          <div className="about-workflow-steps">
            {workflow.map(({ icon: Icon, label }, index) => (
              <div className="about-workflow-step" key={label}>
                <span><Icon aria-hidden="true" /></span>
                <strong>{label}</strong>
                {index < workflow.length - 1 && <i aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
