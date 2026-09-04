import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  SaveIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EditIcon,
  TrashIcon,
} from './AdminIcons';

function FormBuilderTab({ showToast, initialOccurrenceId }) {
  const [occurrences, setOccurrences] = useState([]);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState(initialOccurrenceId || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form schema fields
  const [fields, setFields] = useState([]);

  // Modal / Form state for adding/editing a field
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);

  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldRequired, setFieldRequired] = useState(true);
  const [fieldOptions, setFieldOptions] = useState([]);
  const [newOptionText, setNewOptionText] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadOccurrences() {
      try {
        const { data, error } = await supabase
          .from('event_occurrences')
          .select('id, season_name, form_schema, event_programs(name)')
          .order('created_at', { ascending: false });

        if (!isCurrent) return;
        if (error) throw error;
        setOccurrences(data || []);

        const targetId = initialOccurrenceId || (data && data[0]?.id) || '';
        setSelectedOccurrenceId(targetId);

        const current = data?.find((o) => o.id === targetId);
        if (current && Array.isArray(current.form_schema)) {
          setFields(current.form_schema);
        } else {
          setFields([]);
        }
      } catch (err) {
        console.error('Error loading occurrences for form builder:', err);
        showToast('Failed to load events for form configuration', 'error');
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadOccurrences();

    return () => {
      isCurrent = false;
    };
  }, [initialOccurrenceId, showToast]);

  // When occurrence changes, reload its schema
  const handleOccurrenceChange = (id) => {
    setSelectedOccurrenceId(id);
    const selected = occurrences.find((o) => o.id === id);
    if (selected && Array.isArray(selected.form_schema)) {
      setFields(selected.form_schema);
    } else {
      setFields([]);
    }
  };

  // Open modal for adding/editing a field
  const openFieldModal = (index = null) => {
    if (index !== null) {
      const f = fields[index];
      setEditingFieldIndex(index);
      setFieldLabel(f.label || '');
      setFieldType(f.type || 'text');
      setFieldPlaceholder(f.placeholder || '');
      setFieldRequired(f.required ?? true);
      setFieldOptions(f.options ? [...f.options] : []);
    } else {
      setEditingFieldIndex(null);
      setFieldLabel('');
      setFieldType('text');
      setFieldPlaceholder('');
      setFieldRequired(true);
      setFieldOptions([]);
    }
    setNewOptionText('');
    setFieldModalOpen(true);
  };

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    if (fieldOptions.includes(newOptionText.trim())) return;
    setFieldOptions([...fieldOptions, newOptionText.trim()]);
    setNewOptionText('');
  };

  const handleRemoveOption = (optToRemove) => {
    setFieldOptions(fieldOptions.filter((o) => o !== optToRemove));
  };

  const handleSaveField = (e) => {
    e.preventDefault();
    if (!fieldLabel.trim()) {
      showToast('Field label is required', 'error');
      return;
    }

    const fieldData = {
      id:
        editingFieldIndex !== null
          ? fields[editingFieldIndex].id
          : `q_${Date.now()}_${fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)}`,
      label: fieldLabel.trim(),
      type: fieldType,
      placeholder: fieldPlaceholder.trim(),
      required: fieldRequired,
      options: fieldType === 'select' ? fieldOptions : undefined,
    };

    let updated;
    if (editingFieldIndex !== null) {
      updated = [...fields];
      updated[editingFieldIndex] = fieldData;
    } else {
      updated = [...fields, fieldData];
    }

    setFields(updated);
    setFieldModalOpen(false);
  };

  const handleDeleteField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleMoveField = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const updated = [...fields];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setFields(updated);
  };

  // Save full form_schema to Supabase JSONB column
  const handleSaveSchemaToDatabase = async () => {
    if (!selectedOccurrenceId) {
      showToast('No event occurrence selected', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('event_occurrences')
        .update({
          form_schema: fields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOccurrenceId);

      if (error) throw error;

      // Update local state
      setOccurrences((prev) =>
        prev.map((o) => (o.id === selectedOccurrenceId ? { ...o, form_schema: fields } : o))
      );
      showToast('Application form saved successfully!');
    } catch (err) {
      console.error('Error saving form schema:', err);
      showToast(err.message || 'Failed to save form schema', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading application form builder...</p>
      </div>
    );
  }

  const selectedOccurrence = occurrences.find((o) => o.id === selectedOccurrenceId);

  return (
    <div>
      <div className="tab-header">
        <div>
          <h1 className="tab-header-title">Dynamic Form Builder</h1>
          <p className="tab-header-subtitle">
            Configure custom application questions for each event round without writing code.
          </p>
        </div>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={() => openFieldModal()}>
            + Add Question
          </button>
          <button
            className="btn btn-primary"
            disabled={saving}
            onClick={handleSaveSchemaToDatabase}
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <SaveIcon size={16} />
                <span>Save Form Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target occurrence selector */}
      <div className="admin-card" style={{ padding: '18px 24px' }}>
        <div className="form-row" style={{ alignItems: 'center' }}>
          <div className="admin-form-group" style={{ margin: 0 }}>
            <label style={{ color: '#787a91', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Select Event Occurrence to Configure:
            </label>
            <select
              className="admin-select"
              value={selectedOccurrenceId}
              onChange={(e) => handleOccurrenceChange(e.target.value)}
            >
              {occurrences.map((occ) => (
                <option key={occ.id} value={occ.id}>
                  {occ.event_programs?.name || 'Program'} — {occ.season_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '0.88rem', color: '#787a91', marginTop: '16px' }}>
            Current Question Count:{' '}
            <strong style={{ color: '#0f044c' }}>{fields.length} questions</strong>
          </div>
        </div>
      </div>

      {/* Two columns: Field Editor List & Live Preview */}
      <div className="builder-columns">
        {/* Left: Questions List */}
        <div>
          <h3 style={{ fontSize: '1.1rem', color: '#0f044c', marginBottom: '14px' }}>
            Configured Questions
          </h3>

          {fields.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#787a91', marginBottom: '16px' }}>
                No questions defined for this event occurrence yet.
              </p>
              <button className="btn btn-primary" onClick={() => openFieldModal()}>
                + Add First Question
              </button>
            </div>
          ) : (
            fields.map((field, idx) => (
              <div className="builder-field-card" key={field.id || idx}>
                <div className="builder-field-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: '#787a91',
                        fontSize: '0.85rem',
                        width: '24px',
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <span className="builder-field-title">{field.label}</span>
                    {field.required && (
                      <span style={{ color: '#ef4444', fontWeight: 700 }} title="Required">
                        *
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn-icon"
                      disabled={idx === 0}
                      onClick={() => handleMoveField(idx, -1)}
                      title="Move Up"
                    >
                      <ChevronUpIcon size={14} />
                    </button>
                    <button
                      className="btn-icon"
                      disabled={idx === fields.length - 1}
                      onClick={() => handleMoveField(idx, 1)}
                      title="Move Down"
                    >
                      <ChevronDownIcon size={14} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => openFieldModal(idx)}
                      title="Edit Question"
                    >
                      <EditIcon size={15} />
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDeleteField(idx)}
                      title="Delete Question"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge badge-info">{field.type}</span>
                  {field.required ? (
                    <span className="badge badge-danger">Required</span>
                  ) : (
                    <span className="badge badge-neutral">Optional</span>
                  )}
                  {field.placeholder && (
                    <span style={{ fontSize: '0.8rem', color: '#787a91' }}>
                      Placeholder: "{field.placeholder}"
                    </span>
                  )}
                </div>

                {field.type === 'select' && field.options && field.options.length > 0 && (
                  <div className="builder-options-list">
                    {field.options.map((opt, oIdx) => (
                      <span className="builder-option-pill" key={oIdx}>
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {fields.length > 0 && (
            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={() => openFieldModal()}
            >
              + Add Another Question
            </button>
          )}
        </div>

        {/* Right: Live Interactive Form Preview */}
        <div>
          <h3 style={{ fontSize: '1.1rem', color: '#0f044c', marginBottom: '14px' }}>
            Applicant Preview
          </h3>
          <div className="preview-container">
            <div style={{ marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h4 style={{ margin: '0 0 4px', color: '#0f044c' }}>
                Application: {selectedOccurrence?.event_programs?.name} — {selectedOccurrence?.season_name}
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#787a91' }}>
                This is how the application form will appear on the public registration page.
              </p>
            </div>

            {fields.length === 0 ? (
              <p style={{ color: '#787a91', textAlign: 'center', margin: '40px 0' }}>
                Add questions on the left to see the live form preview.
              </p>
            ) : (
              <form onSubmit={(e) => e.preventDefault()}>
                {fields.map((field) => (
                  <div className="admin-form-group" key={field.id}>
                    <label>
                      {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        className="admin-input"
                        placeholder={field.placeholder || ''}
                        disabled
                      />
                    )}

                    {field.type === 'email' && (
                      <input
                        type="email"
                        className="admin-input"
                        placeholder={field.placeholder || 'example@email.com'}
                        disabled
                      />
                    )}

                    {field.type === 'phone' && (
                      <input
                        type="tel"
                        className="admin-input"
                        placeholder={field.placeholder || '+20 ...'}
                        disabled
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        className="admin-input"
                        placeholder={field.placeholder || '0'}
                        disabled
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        className="admin-textarea"
                        placeholder={field.placeholder || ''}
                        disabled
                      />
                    )}

                    {field.type === 'select' && (
                      <select className="admin-select" disabled>
                        <option value="">Select an option...</option>
                        {(field.options || []).map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === 'checkbox' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" disabled />
                        <span style={{ fontSize: '0.88rem', color: '#787a91' }}>
                          {field.placeholder || 'Yes, I agree / confirm'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                <button className="btn btn-primary" style={{ width: '100%', opacity: 0.6 }} disabled>
                  Submit Application (Preview Only)
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Field Editor Modal */}
      {fieldModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingFieldIndex !== null ? 'Edit Question' : 'Add Question'}
              </h3>
              <button className="modal-close-btn" onClick={() => setFieldModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveField}>
              <div className="modal-body">
                <div className="admin-form-group">
                  <label>Question Label / Prompt *</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Academic Year, GitHub Profile, Why do you want to join?"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="admin-form-group">
                    <label>Field Type</label>
                    <select
                      className="admin-select"
                      value={fieldType}
                      onChange={(e) => setFieldType(e.target.value)}
                    >
                      <option value="text">Short Text</option>
                      <option value="textarea">Paragraph / Long Text</option>
                      <option value="email">Email Address</option>
                      <option value="phone">Phone Number</option>
                      <option value="number">Numeric</option>
                      <option value="select">Dropdown Selection</option>
                      <option value="checkbox">Checkbox (Yes / No)</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Requirement</label>
                    <select
                      className="admin-select"
                      value={fieldRequired ? 'true' : 'false'}
                      onChange={(e) => setFieldRequired(e.target.value === 'true')}
                    >
                      <option value="true">Required (*)</option>
                      <option value="false">Optional</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Placeholder or Input Hint</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. https://github.com/username"
                    value={fieldPlaceholder}
                    onChange={(e) => setFieldPlaceholder(e.target.value)}
                  />
                </div>

                {/* Dropdown Options manager */}
                {fieldType === 'select' && (
                  <div className="admin-form-group">
                    <label>Dropdown Options *</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="Add an option (e.g. First Year)"
                        value={newOptionText}
                        onChange={(e) => setNewOptionText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOption();
                          }
                        }}
                      />
                      <button type="button" className="btn btn-secondary" onClick={handleAddOption}>
                        Add
                      </button>
                    </div>

                    {fieldOptions.length === 0 ? (
                      <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0 }}>
                        Please add at least one option for dropdown questions.
                      </p>
                    ) : (
                      <div className="builder-options-list">
                        {fieldOptions.map((opt, idx) => (
                          <span className="builder-option-pill" key={idx}>
                            {opt}
                            <button type="button" onClick={() => handleRemoveOption(opt)}>
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFieldModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingFieldIndex !== null ? 'Update Question' : 'Add to Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormBuilderTab;
