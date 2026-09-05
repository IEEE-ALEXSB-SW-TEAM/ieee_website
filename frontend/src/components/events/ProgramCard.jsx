function ProgramCard({ program, occurrenceCount, onSelect }) {
  return (
    <button className="program-card" onClick={() => onSelect(program)}>
      <span className="program-card-category">{program.event_categories.name}</span>
      <h3>{program.name}</h3>
      <span className="program-card-footer">{occurrenceCount} {occurrenceCount === 1 ? "season" : "seasons"}<span aria-hidden="true">→</span></span>
    </button>
  );
}

export default ProgramCard;