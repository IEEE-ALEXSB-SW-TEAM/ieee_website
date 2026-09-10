import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../lib/supabase";
import "../style/Home.css";

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveEvents = async () => {
      const { data, error } = await supabase
        .from("event_occurrences")
        .select(`
          id,
          season_name,
          slug,
          description,
          start_date,
          end_date,
          status,
          applications_open,
          event_programs (
            name,
            slug,
            event_categories (
              name
            )
          )
        `)
        .eq("status", "upcoming")
        .eq("applications_open", true)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error fetching active events:", error);
        setEvents([]);
      } else {
        setEvents(data || []);
      }

      setLoading(false);
    };

    fetchActiveEvents();
  }, []);

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
              professional development, innovation, and
              community.
            </p>

            <div className="hero-buttons">
              <Link to="/events" className="primary-btn">
                Explore Events
              </Link>

              <Link to="/contact" className="secondary-btn">
                Contact Us
              </Link>
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

              <Link to="/contact" className="text-link">
                Get in touch with us →
              </Link>
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
                  Develop professionally through real
                  experiences, competitions, and career
                  opportunities.
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
              backgrounds and technical disciplines. Our
              activities provide a space where members can exchange
              knowledge, work together, and turn ideas into real
              projects.
            </p>
          </div>
        </div>
      </section>

      {/* ================= ACTIVE EVENTS ================= */}

      <section className="events-section">
        <div className="section-container">
          <div className="events-heading">
            <div>
              <span className="section-label">
                WHAT'S HAPPENING
              </span>

              <h2>Upcoming Events</h2>
            </div>

            <Link to="/events" className="view-all">
              View all events →
            </Link>
          </div>

          {loading ? (
            <p>Loading events...</p>
          ) : events.length === 0 ? (
            <p>
              No applications are currently open. Check back
              soon.
            </p>
          ) : (
            <div className="events-grid">
              {events.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.event_programs.slug}/${event.slug}`}
                  className="event-card event-card-link"
                >
                  <div className="event-card-top">
                    <span className="event-status">
                      Applications Open
                    </span>

                    <span className="event-category">
                      {event.event_programs?.event_categories?.name}
                    </span>
                  </div>

                  <h3>
                    {event.event_programs?.name} —{" "}
                    {event.season_name}
                  </h3>

                  <p>
                    {event.description ||
                      "Discover this upcoming opportunity with IEEE AlexSB."}
                  </p>

                  <div className="event-card-footer">
                    <span>
                      {event.start_date
                        ? new Date(
                            event.start_date
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Date TBA"}
                    </span>

                    <span>
                      View Event →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
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

          <Link to="/register" className="cta-btn">
            Join IEEE AlexSB
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;