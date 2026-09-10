import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { supabase } from "../lib/supabase";
import ApplicationForm from "../components/events/ApplicationForm";
import "../style/OccurrenceDetails.css";

const formatDate = (date) => {
  if (!date) return "Date TBA";

  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

function OccurrenceDetails() {
  const { programSlug, occurrenceSlug } = useParams();

  const [occurrence, setOccurrence] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOccurrence = async () => {
      setLoading(true);
      setError("");

      const { data, error: occurrenceError } =
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
            applications_open,
            form_schema,
            event_programs (
              id,
              name,
              slug,
              event_categories (
                id,
                name,
                slug
              )
            )
          `)
          .eq("slug", occurrenceSlug)
          .eq("event_programs.slug", programSlug)
          .single();

      if (occurrenceError) {
        console.error(
          "Error fetching occurrence:",
          occurrenceError
        );

        setError("This event could not be found.");
        setLoading(false);
        return;
      }

      setOccurrence(data);

      // Check whether the current user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);

      setLoading(false);
    };

    fetchOccurrence();
  }, [programSlug, occurrenceSlug]);

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

  if (error || !occurrence) {
    return (
      <main className="events-page">
        <div className="events-container">
          <div className="events-state">
            <h3>Event not found</h3>
            <p>{error}</p>

            <Link
              to="/events"
              className="event-primary-btn"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const program = occurrence.event_programs;

  const isOpenForApplications =
    occurrence.status === "upcoming" &&
    occurrence.applications_open === true;

  const formFields = Array.isArray(occurrence.form_schema)
    ? occurrence.form_schema
    : [];

  return (
    <main className="events-page">
      <div className="events-container">

        {/* ================= BREADCRUMB ================= */}

        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/events">
            Events
          </Link>

          <span
            className="breadcrumb-separator"
            aria-hidden="true"
          >
            /
          </span>

          <Link to={`/events/${program.slug}`}>
            {program.name}
          </Link>

          <span
            className="breadcrumb-separator"
            aria-hidden="true"
          >
            /
          </span>

          <strong aria-current="page">
            {occurrence.season_name}
          </strong>
        </nav>

        {/* ================= EVENT HEADER ================= */}

        <section className="occurrence-detail">
          <div className="occurrence-detail-header">
            <div>
              <span className="events-section-label">
                {program.event_categories?.name}
              </span>

              <h1>{program.name}</h1>

              <h2>{occurrence.season_name}</h2>
            </div>

            <span
              className={`status-badge status-${occurrence.status}`}
            >
              {occurrence.status}
            </span>
          </div>

          {/* ================= DATE ================= */}

          <div className="occurrence-detail-date">
            <strong>
              {formatDate(occurrence.start_date)}

              {occurrence.end_date &&
                occurrence.end_date !==
                  occurrence.start_date &&
                ` - ${formatDate(
                  occurrence.end_date
                )}`}
            </strong>
          </div>

          {/* ================= DESCRIPTION ================= */}

          {occurrence.description && (
            <div className="occurrence-detail-description">
              <span className="events-section-label">
                ABOUT THIS EVENT
              </span>

              <p>{occurrence.description}</p>
            </div>
          )}
        </section>

        {/* ================= APPLICATION ================= */}

        {isOpenForApplications && (
          <section className="events-drilldown">

            {isLoggedIn ? (
              // Logged-in users can see and submit the form
              formFields.length > 0 ? (
                <ApplicationForm
                  occurrence={occurrence}
                  fields={formFields}
                />
              ) : (
                <div className="events-state">
                  <h3>Applications are open</h3>

                  <p>
                    The application form for this event
                    will be available soon.
                  </p>
                </div>
              )
            ) : (
              // Logged-out users can see that applications
              // are open, but must log in to apply
              <div className="events-state">
                <h3>Applications are open</h3>

                <p>
                  Please log in to your account to apply
                  for this event.
                </p>

                <Link
                  to="/login"
                  className="event-primary-btn"
                >
                  Login to Apply
                </Link>
              </div>
            )}

          </section>
        )}

        {/* ================= COMPLETED / CLOSED ================= */}

        {!isOpenForApplications && (
          <section className="events-drilldown">
            <div className="events-state">

              {occurrence.status === "completed" ? (
                <>
                  <h3>Event completed</h3>

                  <p>
                    This event has already been completed.
                  </p>
                </>
              ) : (
                <>
                  <h3>Applications are closed</h3>

                  <p>
                    Applications for this event are
                    currently unavailable.
                  </p>
                </>
              )}

            </div>
          </section>
        )}

      </div>
    </main>
  );
}

export default OccurrenceDetails;