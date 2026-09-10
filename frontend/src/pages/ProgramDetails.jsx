import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { supabase } from "../lib/supabase";
import "../style/ProgramDetails.css";

const formatDate = (date) => {
  if (!date) return "Date TBA";

  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

function ProgramDetails() {
  const { programSlug } = useParams();

  const [program, setProgram] = useState(null);
  const [occurrences, setOccurrences] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProgram = async () => {
      setLoading(true);
      setError("");

      const { data: programData, error: programError } =
        await supabase
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
          .eq("slug", programSlug)
          .single();

      if (programError) {
        console.error("Error fetching program:", programError);
        setError("This event program could not be found.");
        setLoading(false);
        return;
      }

      const { data: occurrencesData, error: occurrencesError } =
        await supabase
          .from("event_occurrences")
          .select(`
            id,
            program_id,
            season_name,
            slug,
            description,
            cover_image_url,
            start_date,
            end_date,
            status,
            applications_open
          `)
          .eq("program_id", programData.id)
          .order("start_date", { ascending: false });

      if (occurrencesError) {
        console.error(
          "Error fetching occurrences:",
          occurrencesError
        );

        setError("Unable to load this event's occurrences.");
        setLoading(false);
        return;
      }

      setProgram(programData);
      setOccurrences(occurrencesData || []);

      setLoading(false);
    };

    fetchProgram();
  }, [programSlug]);

  if (loading) {
    return (
      <main className="events-page">
        <div className="events-container">
          <div className="events-state">
            <h3>Loading event...</h3>
          </div>
        </div>
      </main>
    );
  }

  if (error || !program) {
    return (
      <main className="events-page">
        <div className="events-container">
          <div className="events-state">
            <h3>Event not found</h3>
            <p>{error}</p>

            <Link to="/events" className="event-primary-btn">
              Back to Events
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="events-page">
      <div className="events-container">
        {/* ================= BREADCRUMB ================= */}

        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/events">Events</Link>

          <span
            className="breadcrumb-separator"
            aria-hidden="true"
          >
            /
          </span>

          <strong aria-current="page">
            {program.name}
          </strong>
        </nav>

        {/* ================= PROGRAM INTRO ================= */}

        <section className="events-drilldown">
          <div className="events-section-heading compact-heading">
            <div>
              <span className="events-section-label">
                {program.event_categories?.name}
              </span>

              <h1>{program.name}</h1>
            </div>
          </div>

          {program.description && (
            <div className="program-description">
              <p>{program.description}</p>
            </div>
          )}
        </section>

        {/* ================= OCCURRENCES ================= */}

        <section
          className="events-drilldown"
          aria-labelledby="occurrences-heading"
        >
          <div className="events-section-heading">
            <div>
              <span className="events-section-label">
                PROGRAM OCCURRENCES
              </span>

              <h2 id="occurrences-heading">
                Previous & Current Editions
              </h2>
            </div>

            <p>
              Explore the different editions of {program.name}.
            </p>
          </div>

          {occurrences.length === 0 ? (
            <div className="events-state">
              <h3>No occurrences yet.</h3>
              <p>
                There are no editions of this program available
                right now.
              </p>
            </div>
          ) : (
            <div className="occurrence-list">
              {occurrences.map((occurrence) => (
                <article
                  className="occurrence-card"
                  key={occurrence.id}
                >
                  <div className="occurrence-card-heading">
                    <div>
                      <span className="occurrence-season">
                        {occurrence.season_name}
                      </span>

                      <h3>
                        {formatDate(occurrence.start_date)}
                        {occurrence.end_date &&
                          occurrence.end_date !==
                            occurrence.start_date &&
                          ` - ${formatDate(
                            occurrence.end_date
                          )}`}
                      </h3>
                    </div>

                    <span
                      className={`status-badge status-${occurrence.status}`}
                    >
                      {occurrence.status}
                    </span>
                  </div>

                  <p>
                    {occurrence.description ||
                      "More information about this occurrence will be available soon."}
                  </p>

                  <div className="occurrence-card-footer">
                    <span>
                      {occurrence.applications_open &&
                      occurrence.status === "upcoming"
                        ? "Applications are open"
                        : occurrence.status === "completed"
                        ? "Completed"
                        : "Applications closed"}
                    </span>

                    <Link
                      to={`/events/${program.slug}/${occurrence.slug}`}
                      className="event-primary-btn"
                    >
                      View Details
                      <span aria-hidden="true"> →</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ProgramDetails;