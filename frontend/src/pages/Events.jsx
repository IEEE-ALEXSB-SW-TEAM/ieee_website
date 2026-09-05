import { useState } from "react";
import EventsHero from "../components/events/EventsHero";
import CategoryTabs from "../components/events/CategoryTabs";
import ProgramGrid from "../components/events/ProgramGrid";
import Breadcrumb from "../components/events/Breadcrumb";
import OccurrenceList from "../components/events/OccurrenceList";
import ApplicationForm from "../components/events/ApplicationForm";
import { mockCategories, mockFormFields, mockOccurrences, mockPrograms } from "../data/mockEvents";
import "../style/Events.css";

function Events() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);

  const filteredPrograms = activeCategory === "all"
    ? mockPrograms
    : mockPrograms.filter((program) => program.category_id === activeCategory);

  const programOccurrences = selectedProgram
    ? mockOccurrences
        .filter((occurrence) => occurrence.program_id === selectedProgram.id)
        .sort((first, second) => new Date(second.start_date) - new Date(first.start_date))
    : [];

  const openProgram = (program) => {
    setSelectedProgram(program);
    setSelectedOccurrence(null);
  };

  const returnToPrograms = () => {
    setSelectedProgram(null);
    setSelectedOccurrence(null);
  };

  const returnToOccurrences = () => setSelectedOccurrence(null);

  return (
    <main className="events-page">
      <EventsHero />
      <div className="events-container">
        {!selectedProgram && (
          <section className="events-browse" aria-labelledby="programs-heading">
            <div className="events-section-heading">
              <div>
                <span className="events-section-label">EXPLORE THE CALENDAR</span>
                <h2 id="programs-heading">Find your next opportunity</h2>
              </div>
              <p>Browse recurring programs and see every season in one place.</p>
            </div>
            <CategoryTabs categories={mockCategories} active={activeCategory} onSelect={setActiveCategory} />
            <ProgramGrid programs={filteredPrograms} occurrences={mockOccurrences} onSelect={openProgram} />
          </section>
        )}

        {selectedProgram && !selectedOccurrence && (
          <section className="events-drilldown" aria-labelledby="occurrences-heading">
            <Breadcrumb items={[{ label: "Events", onClick: returnToPrograms }, { label: selectedProgram.name }]} />
            <div className="events-section-heading compact-heading">
              <div>
                <span className="events-section-label">PROGRAM HISTORY</span>
                <h2 id="occurrences-heading">{selectedProgram.name}</h2>
              </div>
              <p>Explore dates, details, and application status for each season.</p>
            </div>
            <OccurrenceList occurrences={programOccurrences} onApply={setSelectedOccurrence} />
          </section>
        )}

        {selectedOccurrence && (
          <section className="events-drilldown" aria-labelledby="application-heading">
            <Breadcrumb items={[
              { label: "Events", onClick: returnToPrograms },
              { label: selectedProgram.name, onClick: returnToOccurrences },
              { label: selectedOccurrence.season_name },
            ]} />
            <ApplicationForm occurrence={selectedOccurrence} fields={mockFormFields} />
          </section>
        )}
      </div>
    </main>
  );
}

export default Events;