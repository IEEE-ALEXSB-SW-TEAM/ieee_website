import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "../style/Home.css";

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("event_occurrences")
        .select(`
          id,
          season_name,
          description,
          start_date,
          status,
          applications_open,
          event_programs (
            name,
            event_categories ( name )
          )
        `)
        .eq("applications_open", true)
        .order("start_date", { ascending: true })
        .limit(3);

      if (error) {
        console.error("Error fetching events:", error);
      } else {
        setEvents(data);
      }
      setLoading(false);
    };

    fetchEvents();
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

          {loading ? (
            <p>Loading events...</p>
          ) : events.length === 0 ? (
            <p>No open events right now — check back soon.</p>
          ) : (
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
                      {event.event_programs?.event_categories?.name}
                    </span>
                  </div>
                  <h3>{event.event_programs?.name} — {event.season_name}</h3>
                  <p>{event.description}</p>
                  <div className="event-card-footer">
                    <span>
                      {event.start_date
                        ? new Date(event.start_date).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          )
                        : "Date TBA"}
                    </span>
                    <a href={`/events/${event.id}`}>
                      View Event →
                    </a>
                  </div>
                </article>
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
          <a href="/register" className="cta-btn">
            Join IEEE AlexSB
          </a>
        </div>
      </section>
    </div>
  );
}
export default Home;