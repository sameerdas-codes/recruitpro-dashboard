import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import About from "./About";
import Contact from "./Contact";
import "../styles/Home.css";
import "../styles/CompanyPages.css";

function Home() {
  return (
    <div className="home-page company-page">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <About />
        <Contact />
        <section className="home-final-cta">
          <div>
            <span className="home-section-kicker">MAKE ROOM FOR GREAT PEOPLE</span>
            <h2>Bring your next hire into focus.</h2>
            <p>Start organizing your hiring workflow with RecruitPro.</p>
          </div>
          <Link to="/register" className="home-button home-button-primary">
            Create your account <FaArrowRight aria-hidden="true" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Home;