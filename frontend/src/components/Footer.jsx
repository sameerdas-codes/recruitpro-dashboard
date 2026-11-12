import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="home-footer bg-slate-950 text-gray-400 border-t border-slate-800">

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-8 py-12">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold text-green-400">
              RecruitPro
            </h2>

            <p className="mt-4 leading-relaxed max-w-xs">
                A focused workspace for job management, candidate applications and
                interview coordination.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Platform
            </h3>

            <ul className="space-y-3">
              <li><Link to="/#features" className="hover:text-green-400">Job management</Link></li>
              <li><Link to="/#features" className="hover:text-green-400">Applications</Link></li>
              <li><Link to="/interviews" className="hover:text-green-400">Interview scheduling</Link></li>
              <li><Link to="/notifications" className="hover:text-green-400">Notifications</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Company
            </h3>

            <ul className="space-y-3">
              <li><Link to="/#about" className="hover:text-green-400">About RecruitPro</Link></li>
              <li><Link to="/#contact" className="hover:text-green-400">Contact</Link></li>
              <li><Link to="/register" className="hover:text-green-400">Create an account</Link></li>
              <li><Link to="/login" className="hover:text-green-400">Sign in</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Contact
            </h3>

            <a href="mailto:recruitpro4401@gmail.com" className="hover:text-green-400">
              recruitpro4401@gmail.com
            </a>
          </div>

        </div>

      </div>

      {/* Copyright */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-8 py-5 text-center">
          <p>
            © 2026 RecruitPro. All rights reserved.
          </p>
        </div>
      </div>

    </footer>
  );
}

export default Footer;