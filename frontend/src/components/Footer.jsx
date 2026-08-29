import "../style/Footer.css";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        <div className="footer-main">

          <div className="footer-brand">
            <h2>IEEE AlexSB</h2>

            <p>
              Empowering students through knowledge,
              innovation, and community.
            </p>
          </div>


          <div className="footer-links">

            <div className="footer-column">
              <h3>Explore</h3>

              <a href="/">Home</a>
              <a href="/events">Events</a>
              <a href="/contact">Contact Us</a>
            </div>


            <div className="footer-column">
              <h3>Account</h3>

              <a href="/login">Login</a>
              <a href="/register">Join Us</a>
            </div>


            <div className="footer-column">
              <h3>Follow Us</h3>

              <a href="#" target="_blank" rel="noreferrer">
                Facebook
              </a>

              <a href="#" target="_blank" rel="noreferrer">
                Instagram
              </a>

              <a href="#" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </div>

          </div>

        </div>


        <div className="footer-bottom">

          <span>
            © IEEE Alexandria Student Branch
          </span>

          <span>
            All rights reserved.
          </span>

        </div>

      </div>

    </footer>
  );
}

export default Footer;