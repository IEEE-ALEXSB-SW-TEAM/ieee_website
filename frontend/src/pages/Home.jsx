import "../style/Home.css";

function Home() {
  // Temporary placeholder events
  // This will be replaced with Supabase data later
  const events = [
    {
      id: 1,
      name: "Frontend Bootcamp",
      category: "Bootcamps",
      description:
        "Learn the fundamentals of modern frontend development and build real-world web applications.",
      date: "August 30, 2026",
      status: "Open",
    },
    {
      id: 2,
      name: "AI & Machine Learning Workshop",
      category: "Courses",
      description:
        "An introductory workshop covering the fundamentals of artificial intelligence and machine learning.",
      date: "September 5, 2026",
      status: "Open",
    },
    {
      id: 3,
      name: "Career & Industry Day",
      category: "Career & Industry",
      description:
        "Connect with industry professionals and learn more about career opportunities in technology.",
      date: "September 15, 2026",
      status: "Upcoming",
    },
  ];

  return (
    <div className="home-page">
      {/* ================= HERO ================= */}

      <section className="hero">
        <div className="hero-container">

          <div className="hero-content">
            <span className="hero-label">
              IEEE Alexandria Student Branch
            </span>

            <h1>
              Learn.
              <span> Connect.</span>
              <br />
              Build the Future.
            </h1>

            <p>
              Empowering students through technical education,
              professional development, innovation, and community.
            </p>

            <div className="hero-buttons">
              <a href="/events" className="primary-btn">
                Explore Events
              </a>

              <a href="/contact" className="secondary-btn">
                Contact Us
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-circle">
              <div className="hero-circle-inner">
                IEEE
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ================= ABOUT ================= */}

      <section className="about-section">
        <div className="section-container">

          <div className="section-heading">
            <span>WHO WE ARE</span>
            <h2>About IEEE AlexSB</h2>
          </div>

          <div className="about-grid">

            <div className="about-text">
              <p>
                IEEE Alexandria Student Branch is a student-driven
                community focused on creating opportunities for
                students to learn, collaborate, and grow.
              </p>

              <p>
                Through technical events, educational programs,
                competitions, career activities, and community
                initiatives, we connect students with knowledge,
                practical experience, and a wider professional
                network.
              </p>

              <a href="/contact" className="text-link">
                Get in touch with us →
              </a>
            </div>

            <div className="about-cards">

              <div className="info-card">
                <div className="info-card-number">01</div>
                <h3>Learn</h3>
                <p>
                  Technical programs and educational activities
                  designed to build practical skills.
                </p>
              </div>

              <div className="info-card">
                <div className="info-card-number">02</div>
                <h3>Connect</h3>
                <p>
                  Meet students, professionals, mentors, and
                  members of the IEEE community.
                </p>
              </div>

              <div className="info-card">
                <div className="info-card-number">03</div>
                <h3>Grow</h3>
                <p>
                  Develop professionally through real experiences,
                  competitions, and career opportunities.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* ================= BRANCH ================= */}

      <section className="branch-section">
        <div className="section-container">

          <div className="branch-content">

            <div>
              <span className="section-label">
                OUR COMMUNITY
              </span>

              <h2>
                More Than Just
                <br />
                <span>A Student Branch.</span>
              </h2>
            </div>

            <p>
              IEEE AlexSB brings together students from different
              backgrounds and technical disciplines. Our activities
              provide a space where members can exchange knowledge,
              work together, and turn ideas into real projects.
            </p>

          </div>

        </div>
      </section>


      {/* ================= EVENTS ================= */}

      <section className="events-section">
        <div className="section-container">

          <div className="events-heading">

            <div>
              <span className="section-label">
                WHAT'S HAPPENING
              </span>

              <h2>Active Events</h2>
            </div>

            <a href="/events" className="view-all">
              View all events →
            </a>

          </div>


          <div className="events-grid">

            {events.map((event) => (
              <article
                className="event-card"
                key={event.id}
              >

                <div className="event-card-top">
                  <span className="event-status">
                    {event.status}
                  </span>

                  <span className="event-category">
                    {event.category}
                  </span>
                </div>

                <h3>{event.name}</h3>

                <p>{event.description}</p>

                <div className="event-card-footer">

                  <span>{event.date}</span>

                  <a href={`/events/${event.id}`}>
                    View Event →
                  </a>

                </div>

              </article>
            ))}

          </div>

        </div>
      </section>


      {/* ================= CTA ================= */}

      <section className="cta-section">
        <div className="cta-container">

          <div>
            <span className="section-label">
              BE PART OF THE COMMUNITY
            </span>

            <h2>
              Ready to take the
              <br />
              next step?
            </h2>
          </div>

          <a href="/register" className="cta-btn">
            Join IEEE AlexSB
          </a>

        </div>
      </section>
    </div>
  );
}

export default Home;