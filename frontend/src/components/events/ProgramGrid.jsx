import ProgramCard from "./ProgramCard";

function ProgramGrid({ programs, occurrences, onSelect }) {
  if (programs.length === 0) {
    return <div className="events-state"><h3>No programs in this category yet.</h3><p>Try another category to keep exploring.</p></div>;
  }

  return (
    <div className="program-grid">
      {programs.map((program) => (
        <ProgramCard key={program.id} program={program} occurrenceCount={occurrences.filter((occurrence) => occurrence.program_id === program.id).length} onSelect={onSelect} />
      ))}
    </div>
  );
}

export default ProgramGrid;