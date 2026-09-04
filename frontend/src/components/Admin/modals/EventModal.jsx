import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { AlertTriangleIcon } from '../AdminIcons';

function EventModal({
  isOpen,
  onClose,
  onSuccess,
  onOpenCategoryModal,
  categories = [],
  eventToEdit = null,
  preselectedCategoryId = null,
  showToast,
}) {
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const prevIsOpenRef = useRef(false);

  const generateSlug = (text) => {
    return (text || '')
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  useEffect(() => {
    if (isOpen && (!prevIsOpenRef.current || eventToEdit)) {
      setModalError('');
      if (eventToEdit) {
        setCategoryId(eventToEdit.category_id || (categories[0]?.id || ''));
        setName(eventToEdit.name || '');
        setSlug(eventToEdit.slug || '');
        setDescription(eventToEdit.description || '');
      } else {
        setCategoryId(preselectedCategoryId || (categories[0]?.id || ''));
        setName('');
        setSlug('');
        setDescription('');
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, eventToEdit, preselectedCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter an event name', 'error');
      return;
    }
    if (!categoryId) {
      showToast('Please select a category for this event', 'error');
      return;
    }

    setSaving(true);
    setModalError('');
    try {
      const payload = {
        category_id: categoryId,
        name: name.trim(),
        slug: slug || generateSlug(name.trim()),
        description: description.trim(),
      };

      let resultData = null;

      if (eventToEdit) {
        const { data, error } = await supabase
          .from('event_programs')
          .update(payload)
          .eq('id', eventToEdit.id)
          .select('*, event_categories(name)')
          .single();

        if (error) throw error;
        resultData = data;
        showToast('Event updated successfully');
      } else {
        const { data, error } = await supabase
          .from('event_programs')
          .insert([payload])
          .select('*, event_categories(name)')
          .single();

        if (error) throw error;
        resultData = data;
        showToast('Event created successfully');
      }

      if (onSuccess) onSuccess(resultData);
      onClose();
    } catch (err) {
      console.error('Error saving event:', err);
      const msg = err.message || 'Failed to save event';
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">
            {eventToEdit ? 'Edit Event' : 'Create Event'}
          </h3>
          <button className="modal-close-btn" onClick={onClose} disabled={saving}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {modalError && (
            <div className="modal-error-banner">
              <AlertTriangleIcon size={18} style={{ flexShrink: 0 }} />
              <span>{modalError}</span>
            </div>
          )}
          <div className="modal-body">
            <div className="admin-form-group">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <label style={{ margin: 0 }}>Category *</label>
                {onOpenCategoryModal && (
                  <button
                    type="button"
                    style={{
                      fontSize: '0.8rem',
                      color: '#141e61',
                      fontWeight: 600,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                    onClick={onOpenCategoryModal}
                  >
                    + New Category
                  </button>
                )}
              </div>

              {categories.length === 0 ? (
                <div style={{ padding: '10px 0' }}>
                  <p style={{ fontSize: '0.85rem', color: '#dc2626', margin: '0 0 6px' }}>
                    No categories found. Please create a category first.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={onOpenCategoryModal}
                  >
                    + Create Category
                  </button>
                </div>
              ) : (
                <select
                  className="admin-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="admin-form-group">
              <label>Event Name *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. Web Development Bootcamp, Robotics Workshop"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!eventToEdit) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
                required
                autoFocus
              />
            </div>

            <div className="admin-form-group">
              <label>Slug (URL Key) *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. web-development-bootcamp"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Description (Optional)</label>
              <textarea
                className="admin-textarea"
                placeholder="General description of what this event or program covers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? 'Saving...'
                : eventToEdit
                ? 'Save Changes'
                : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventModal;
