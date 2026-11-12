import {
  FaBell,
  FaBriefcase,
  FaCalendarCheck,
  FaShieldAlt,
} from "react-icons/fa";

const features = [
  {
    icon: FaBriefcase,
    number: "01",
    title: "Manage every role",
    description:
      "Create and organize openings, then keep role details easy for your hiring team to find.",
  },
  {
    icon: FaShieldAlt,
    number: "02",
    title: "Review applications",
    description:
      "Keep candidate applications and resumes together in a protected, role-aware workflow.",
  },
  {
    icon: FaCalendarCheck,
    number: "03",
    title: "Coordinate interviews",
    description:
      "See interview schedules and candidate details in one convenient place.",
  },
  {
    icon: FaBell,
    number: "04",
    title: "Stay in the loop",
    description:
      "Use in-app notifications to keep candidates and hiring teams up to date.",
  },
];

function Features() {
  return (
    <section id="features" className="home-features">
      <div className="home-section-inner">
        <div className="home-section-heading">
          <span className="home-section-kicker">ONE CONNECTED WORKSPACE</span>
          <h2>Every step of hiring,<br /><span>thoughtfully organized.</span></h2>
          <p>
            From the first job post to the interview calendar, keep the details
            that matter easy to manage.
          </p>
        </div>

        <div className="home-feature-grid">
          {features.map(({ icon: Icon, number, title, description }) => (
            <article className="home-feature-card" key={title}>
              <div className="home-feature-card-top">
                <span className="home-feature-icon"><Icon aria-hidden="true" /></span>
                <span className="home-feature-number">{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>

        <div className="home-workflow">
          <div className="home-workflow-copy">
            <span className="home-section-kicker">LESS SCATTER, MORE CLARITY</span>
            <h2>A workflow your whole team can follow.</h2>
            <p>
              Keep roles, applications and interviews connected, with access
              shaped around each person&apos;s part in the process.
            </p>
          </div>
          <div className="home-workflow-steps">
            {[
              ["01", "Create a role", "Set up the opportunity and share it with candidates."],
              ["02", "Review candidates", "Keep applications organized as your pipeline moves."],
              ["03", "Plan interviews", "Coordinate the next conversation with confidence."],
            ].map(([number, title, description]) => (
              <div className="home-workflow-step" key={number}>
                <span>{number}</span>
                <div><strong>{title}</strong><p>{description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;
