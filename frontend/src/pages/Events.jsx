import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../lib/supabase";
import "../style/Events.css";

function Events() {
  const [categories, setCategories] = useState([]);
  const [programs, setPrograms] = useState([]);

  const [activeCategory, setActiveCategory] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError("");

      const [
        { data: categoriesData, error: categoriesError },
        { data: programsData, error: programsError },
      ] = await Promise.all([
        supabase
          .from("event_categories")
          .select("id, name, slug, description, sort_order")
          .order("sort_order", { ascending: true }),

        supabase
          .from("event_programs")
          .select(`
            id,
            category_id,
            name,
            slug,
            description,
            event_categories (
              id,
              name,
              slug
            )
          `)
          .order("created_at", { ascending: false }),
      ]);

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
        setError("Unable to load event categories.");
        setLoading(false);
        return;
      }

      if (programsError) {
        console.error("Error fetching programs:", programsError);
        setError("Unable to load events.");
        setLoading(false);
        return;
      }

      setCategories(categoriesData || []);
      setPrograms(programsData || []);

      setLoading(false);
    };

    fetchEvents();
  }, []);

  const filteredPrograms =
    activeCategory === "all"
      ? programs
      : programs.filter(
          (program) => program.category_id === activeCategory
        );

  return (
    <main className="events-page">
      {/* ================= HERO ================= */}

      <section className="events-hero">
        <div className="events-hero-inner">
          <div>
            <span className="events-hero-label">
              IEEE ALEXANDRIA STUDENT BRANCH
            </span>

            <h1>Events</h1>

            <p>
              Learn, connect, and build through experiences made
              for the IEEE AlexSB community.
            </p>
          </div>

          <div className="events-hero-mark" aria-hidden="true">
            / / /
          </div>
        </div>
      </section>

      {/* ================= EVENTS ================= */}

      <div className="events-container">
        <section
          className="events-browse"
          aria-labelledby="programs-heading"
        >
          <div className="events-section-heading">
            <div>
              <span className="events-section-label">
                EXPLORE OUR EVENTS
              </span>

              <h2 id="programs-heading">
                Find your next opportunity
              </h2>
            </div>

            <p>
              Explore our programs and discover their different
              editions and opportunities.
            </p>
          </div>

          {/* ================= CATEGORIES ================= */}

          <div
            className="category-tabs"
            role="tablist"
            aria-label="Event categories"
          >
            <button
              className={activeCategory === "all" ? "active" : ""}
              role="tab"
              aria-selected={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                className={
                  activeCategory === category.id ? "active" : ""
                }
                role="tab"
                aria-selected={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* ================= PROGRAMS ================= */}

          {loading ? (
            <div className="events-state">
              <h3>Loading events...</h3>
            </div>
          ) : error ? (
            <div className="events-state">
              <h3>Something went wrong</h3>
              <p>{error}</p>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="events-state">
              <h3>No events in this category yet.</h3>
              <p>
                Try another category to keep exploring.
              </p>
            </div>
          ) : (
            <div className="program-grid">
              {filteredPrograms.map((program) => (
                <Link
                  key={program.id}
                  to={`/events/${program.slug}`}
                  className="program-card"
                >
                  <span className="program-card-category">
                    {program.event_categories?.name}
                  </span>

                  <h3>{program.name}</h3>

                  <span className="program-card-footer">
                    View program
                    <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Events;