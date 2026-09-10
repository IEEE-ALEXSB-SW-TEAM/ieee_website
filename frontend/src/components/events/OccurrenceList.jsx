import OccurrenceCard from "./OccurrenceCard";

function OccurrenceList({ occurrences, onApply }) {
  if (occurrences.length === 0) {
    return <div className="events-state"><h3>No occurrences found.</h3><p>This program has not been scheduled yet.</p></div>;
  }

  return <div className="occurrence-list">{occurrences.map((occurrence) => <OccurrenceCard key={occurrence.id} occurrence={occurrence} onApply={onApply} />)}</div>;
}

export default OccurrenceList;