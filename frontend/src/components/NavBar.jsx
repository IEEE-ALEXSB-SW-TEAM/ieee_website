import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../style/Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate("/");
  };

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
            {session ? (
              <button className="login-btn" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <>
                <a href="/login" className="login-btn">
                  Login
                </a>

                <a href="/register" className="register-btn">
                  Join Us
                </a>
              </>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;