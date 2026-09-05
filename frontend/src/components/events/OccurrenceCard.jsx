import StatusBadge from "./StatusBadge";

const formatDate = (date) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function OccurrenceCard({ occurrence, onApply }) {
  return (
    <article className="occurrence-card">
      <div className="occurrence-card-heading"><div><span className="occurrence-season">{occurrence.season_name}</span><h3>{formatDate(occurrence.start_date)}{occurrence.end_date && occurrence.end_date !== occurrence.start_date ? ` - ${formatDate(occurrence.end_date)}` : ""}</h3></div><StatusBadge status={occurrence.status} /></div>
      <p>{occurrence.description}</p>
      <div className="occurrence-card-footer">
        <span>{occurrence.applications_open ? "Applications are open" : "Applications are closed"}</span>
        {occurrence.applications_open && <button className="event-primary-btn" onClick={() => onApply(occurrence)}>Apply Now <span aria-hidden="true">→</span></button>}
      </div>
    </article>
  );
}

export default OccurrenceCard;