import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { AlertTriangleIcon } from '../AdminIcons';

function CategoryModal({ isOpen, onClose, onSuccess, categoryToEdit = null, showToast }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
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
    if (isOpen && (!prevIsOpenRef.current || categoryToEdit)) {
      setModalError('');
      if (categoryToEdit) {
        setName(categoryToEdit.name || '');
        setSlug(categoryToEdit.slug || '');
        setDescription(categoryToEdit.description || '');
        setSortOrder(categoryToEdit.sort_order ?? 0);
      } else {
        setName('');
        setSlug('');
        setDescription('');
        setSortOrder(0);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, categoryToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a category name', 'error');
      return;
    }

    setSaving(true);
    setModalError('');
    try {
      const payload = {
        name: name.trim(),
        slug: slug || generateSlug(name.trim()),
        description: description.trim(),
        sort_order: parseInt(sortOrder, 10) || 0,
      };

      let resultData = null;

      if (categoryToEdit) {
        const { data, error } = await supabase
          .from('event_categories')
          .update(payload)
          .eq('id', categoryToEdit.id)
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        showToast('Category updated successfully');
      } else {
        const { data, error } = await supabase
          .from('event_categories')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        resultData = data;
        showToast('Category created successfully');
      }

      if (onSuccess) onSuccess(resultData);
      onClose();
    } catch (err) {
      console.error('Error saving category:', err);
      const msg = err.message || 'Failed to save category';
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
            {categoryToEdit ? 'Edit Category' : 'Create Category'}
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
              <label>Category Name *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. Technical Bootcamps, Competitions, Soft Skills"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!categoryToEdit) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
                required
                autoFocus
              />
            </div>

            <div className="form-row">
              <div className="admin-form-group">
                <label>Slug (URL Key) *</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. technical-bootcamps"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Display Sort Order</label>
                <input
                  type="number"
                  className="admin-input"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Description (Optional)</label>
              <textarea
                className="admin-textarea"
                placeholder="Brief description of this category track..."
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
                : categoryToEdit
                ? 'Save Changes'
                : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryModal;
