function ApplicationForm({ occurrence, fields }) {
  const inputForField = (field) => {
    if (field.field_type === "long_text") return <textarea id={field.id} name={field.id} rows="4" required={field.required} />;
    if (field.field_type === "phone") return <input id={field.id} name={field.id} type="tel" required={field.required} />;
    if (field.field_type === "select") return <select id={field.id} name={field.id} defaultValue="" required={field.required}><option value="" disabled>Select an option</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
    if (field.field_type === "checkbox") return <input id={field.id} name={field.id} type="checkbox" required={field.required} />;
    return <input id={field.id} name={field.id} type="text" required={field.required} />;
  };

  return (
    <div className="application-layout">
      <div className="application-intro"><span className="events-section-label">APPLICATION</span><h2 id="application-heading">Apply for {occurrence.season_name}</h2><p>{occurrence.description}</p><div className="application-note"><strong>Applications are open</strong><span>Complete the form and the team will follow up with next steps.</span></div></div>
      <form className="application-form" onSubmit={(event) => event.preventDefault()}>
        {fields.map((field) => <div className={`form-field ${field.field_type === "checkbox" ? "checkbox-field" : ""}`} key={field.id}>{field.field_type === "checkbox" ? <>{inputForField(field)}<label htmlFor={field.id}>{field.label}{field.required && <span> *</span>}</label></> : <><label htmlFor={field.id}>{field.label}{field.required && <span> *</span>}</label>{inputForField(field)}</>}</div>)}
        <button type="submit" className="event-primary-btn" disabled>Submit Application <span aria-hidden="true">→</span></button>
        <p className="form-disabled-note">Submission will be enabled when backend integration is connected.</p>
      </form>
    </div>
  );
}

export default ApplicationForm;