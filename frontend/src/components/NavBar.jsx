import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ShieldIcon } from "./Admin/AdminIcons";
import "../style/Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { session, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          IEEE AlexSB
        </Link>

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
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Home
          </Link>

          <Link to="/events" onClick={() => setMenuOpen(false)}>
            Events
          </Link>

          <Link to="/contact" onClick={() => setMenuOpen(false)}>
            Contact Us
          </Link>

          {/* Admin Panel button displayed only for authorized administrators */}
          {isAdmin && (
            <Link
              to="/admin"
              className="navbar-admin-link"
              onClick={() => setMenuOpen(false)}
            >
              <span className="navbar-admin-icon" aria-hidden="true">
                <ShieldIcon size={16} />
              </span>
              <span>Admin Panel</span>
            </Link>
          )}

          <div className="navbar-auth">
            {session ? (
              <button className="login-btn" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="login-btn">
                  Login
                </Link>

                <Link to="/register" className="register-btn">
                  Join Us
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;