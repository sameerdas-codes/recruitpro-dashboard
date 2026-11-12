import { Link } from "react-router-dom";
import { FaArrowRight, FaBriefcase, FaCalendarCheck, FaCheck } from "react-icons/fa";

function Hero() {
  return (
    <section id="overview" className="home-hero">
      <div className="home-hero-inner">
        <div className="home-hero-copy">
          <div className="home-eyebrow">
            <span className="home-eyebrow-dot" />
            A clearer path to your next opportunity
          </div>
          <h1>
            Find your next
            <br />
            <span>great opportunity.</span>
          </h1>
          <p className="home-hero-description">
            Explore roles, keep track of your applications and stay ready for
            every next step—all in one welcoming place.
          </p>

          <div className="home-hero-actions">
            <Link to="/register" className="home-button home-button-primary">
              Get started <FaArrowRight aria-hidden="true" />
            </Link>
            <Link to="/login" className="home-button home-button-secondary">
              Sign in
            </Link>
          </div>

          <ul className="home-trust-points" aria-label="Platform highlights">
            {["Explore open roles", "Track applications", "Prepare for interviews"].map(
              (item) => (
                <li key={item}>
                  <FaCheck aria-hidden="true" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="home-hero-art">
          <div className="home-art-glow" />
          <div className="home-art-backdrop" />
          <img
            className="home-art-person"
            src="/DeveloperHero.webp"
            alt="A job seeker working at a laptop"
            width="1500"
            height="1467"
            fetchPriority="high"
          />
          <div className="home-art-card home-art-card-jobs">
            <span className="home-art-card-icon"><FaBriefcase aria-hidden="true" /></span>
            <span><strong>Find your fit</strong><small>Explore open opportunities</small></span>
          </div>
          <div className="home-art-card home-art-card-progress">
            <span className="home-art-card-icon"><FaCalendarCheck aria-hidden="true" /></span>
            <span><strong>Keep moving forward</strong><small>Applications &amp; interviews</small></span>
            <FaCheck className="home-art-card-check" aria-hidden="true" />
          </div>
          <span className="home-art-caption">Your next chapter starts here</span>
        </div>
      </div>
      <div className="home-scroll-cue" aria-hidden="true"><span /> Find your place to grow</div>
    </section>
  );
}

export default Hero;
