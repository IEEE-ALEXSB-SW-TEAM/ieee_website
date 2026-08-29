import { useState } from "react";
import "../style/Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">

        <a href="/" className="navbar-logo">
          IEEE AlexSB
        </a>

        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
          <a href="/" onClick={() => setMenuOpen(false)}>
            Home
          </a>

          <a href="/events" onClick={() => setMenuOpen(false)}>
            Events
          </a>

          <a href="/contact" onClick={() => setMenuOpen(false)}>
            Contact Us
          </a>

          <div className="navbar-auth">
            <a href="/login" className="login-btn">
              Login
            </a>

            <a href="/register" className="register-btn">
              Join Us
            </a>
          </div>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;