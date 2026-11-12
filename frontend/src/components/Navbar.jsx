import { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="home-nav">
      <div className="home-nav-inner">
        <Link
          to="/"
          onClick={closeMenu}
          className="home-brand"
        >
          <span className="home-brand-mark">R</span>
          <span>Recruit<span>Pro</span><small>HIRING, IN FOCUS</small></span>
        </Link>

        <div className="home-nav-links">
          <Link to="/#overview">Overview</Link>
          <Link to="/#features">Platform</Link>
          <Link to="/#about">About</Link>
          <Link to="/#contact">Contact</Link>
        </div>

        <div className="home-nav-actions">
          <Link to="/login" className="home-nav-signin">Sign in</Link>
          <Link to="/register" className="home-nav-cta">Get started <span aria-hidden="true">→</span></Link>
        </div>

        <button
          type="button"
          className="home-menu-toggle"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {menuOpen && (
        <div className="home-mobile-menu">
          <Link to="/#overview" onClick={closeMenu}>Overview</Link>
          <Link to="/#features" onClick={closeMenu}>Platform</Link>
          <Link to="/#about" onClick={closeMenu}>About</Link>
          <Link to="/#contact" onClick={closeMenu}>Contact</Link>
          <div>
            <Link to="/login" onClick={closeMenu}>Sign in</Link>
            <Link to="/register" onClick={closeMenu}>Get started <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
