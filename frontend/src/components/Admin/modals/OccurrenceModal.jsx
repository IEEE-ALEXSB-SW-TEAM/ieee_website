import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { UploadIcon, TrashIcon, AlertTriangleIcon } from '../AdminIcons';

function OccurrenceModal({
  isOpen,
  onClose,
  onSuccess,
  onOpenEventModal,
  programs = [],
  occurrenceToEdit = null,
  preselectedProgramId = null,
  showToast,
}) {
  const [programId, setProgramId] = useState('');
  const [seasonName, setSeasonName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('upcoming');
  const [isActive, setIsActive] = useState(true);
  const [applicationsOpen, setApplicationsOpen] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const prevIsOpenRef = useRef(false);
  const fileInputRef = useRef(null);

  const generateSlug = (progName, season) => {
    const combined = `${progName || ''} ${season || ''}`;
    return combined
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  useEffect(() => {
    // Only initialize form fields when modal opens fresh or when occurrenceToEdit changes
    if (isOpen && (!prevIsOpenRef.current || occurrenceToEdit)) {
      setUploadingImage(false);
      setDragOver(false);
      setModalError('');
      if (occurrenceToEdit) {
        setProgramId(occurrenceToEdit.program_id || (programs[0]?.id || ''));
        setSeasonName(occurrenceToEdit.season_name || '');
        setSlug(occurrenceToEdit.slug || '');
        setDescription(occurrenceToEdit.description || '');
        setCoverImageUrl(occurrenceToEdit.cover_image_url || '');
        setStartDate(
          occurrenceToEdit.start_date
            ? occurrenceToEdit.start_date.split('T')[0]
            : ''
        );
        setEndDate(
          occurrenceToEdit.end_date ? occurrenceToEdit.end_date.split('T')[0] : ''
        );
        setStatus((occurrenceToEdit.status || 'upcoming').toLowerCase());
        setIsActive(occurrenceToEdit.is_active ?? true);
        setApplicationsOpen(occurrenceToEdit.applications_open ?? false);
      } else {
        setProgramId(preselectedProgramId || (programs[0]?.id || ''));
        setSeasonName('');
        setSlug('');
        setDescription('');
        setCoverImageUrl('');
        setStartDate('');
        setEndDate('');
        setStatus('upcoming');
        setIsActive(true);
        setApplicationsOpen(false);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, occurrenceToEdit, preselectedProgramId]);

  if (!isOpen) return null;

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP, etc.)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit. Please select a smaller image.', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const BUCKET_NAME = 'event_cover';
      const fileExt = file.name.split('.').pop().toLowerCase();
      const cleanBase = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 30);
      const filePath = `banners/${Date.now()}_${cleanBase}.${fileExt}`;

      let uploadRes = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      // If bucket doesn't exist, attempt to auto-create it
      if (
        uploadRes.error &&
        (uploadRes.error.message?.toLowerCase().includes('bucket not found') ||
          uploadRes.error.statusCode === '404' ||
          uploadRes.error.status === 404)
      ) {
        const { error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
        });
        if (!createErr) {
          uploadRes = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true,
            });
        }
      }

      if (uploadRes.error) {
        if (
          uploadRes.error.message?.toLowerCase().includes('row-level security') ||
          uploadRes.error.statusCode === '403' ||
          uploadRes.error.status === 403
        ) {
          throw new Error('Permission denied: Only administrators can upload event cover images.');
        }
        if (
          uploadRes.error.message?.toLowerCase().includes('bucket not found') ||
          uploadRes.error.statusCode === '404'
        ) {
          throw new Error(
            `Supabase Storage bucket '${BUCKET_NAME}' not found. Please create a public bucket named '${BUCKET_NAME}' in your Supabase Dashboard.`
          );
        }
        throw uploadRes.error;
      }

      // Retrieve public URL link
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      if (data?.publicUrl) {
        setCoverImageUrl(data.publicUrl);
        showToast('Banner image uploaded to Supabase Storage');
      } else {
        throw new Error('Failed to retrieve public URL from Supabase Storage');
      }
    } catch (err) {
      console.error('Error uploading banner image:', err);
      showToast(err.message || 'Failed to upload banner image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (coverImageUrl && coverImageUrl.includes('event_cover')) {
      try {
        const path = coverImageUrl.split('/event_cover/')[1]?.split('?')[0];
        if (path) {
          await supabase.storage.from('event_cover').remove([decodeURIComponent(path)]);
        }
      } catch (e) {
        console.error('Error deleting image from storage:', e);
      }
    }
    setCoverImageUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploadingImage) {
      showToast('Please wait for the banner image to finish uploading', 'error');
      return;
    }
    if (!programId) {
      showToast('Please select a parent event / program', 'error');
      return;
    }
    if (!seasonName.trim()) {
      showToast('Please enter a season, wave, or edition name', 'error');
      return;
    }

    setSaving(true);
    setModalError('');
    try {
      const prog = programs.find((p) => p.id === programId);
      const payload = {
        program_id: programId,
        season_name: seasonName.trim(),
        slug: slug || generateSlug(prog?.name, seasonName.trim()),
        description: description.trim(),
        cover_image_url: coverImageUrl || null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        status: (status || 'upcoming').toLowerCase().trim(),
        is_active: isActive,
        applications_open: applicationsOpen,
        updated_at: new Date().toISOString(),
      };

      let resultData = null;

      if (occurrenceToEdit) {
        const { data, error } = await supabase
          .from('event_occurrences')
          .update(payload)
          .eq('id', occurrenceToEdit.id)
          .select('*, event_programs(name, category_id, event_categories(name))')
          .single();

        if (error) throw error;
        resultData = data;
        showToast('Occurrence updated successfully');
      } else {
        payload.form_schema = []; // default empty jsonb array
        const { data, error } = await supabase
          .from('event_occurrences')
          .insert([payload])
          .select('*, event_programs(name, category_id, event_categories(name))')
          .single();

        if (error) throw error;
        resultData = data;
        showToast('Occurrence created successfully');
      }

      if (onSuccess) onSuccess(resultData);
      onClose();
    } catch (err) {
      console.error('Error saving occurrence:', err);
      const msg = err.message || 'Failed to save occurrence';
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content large">
        <div className="modal-header">
          <h3 className="modal-title">
            {occurrenceToEdit
              ? 'Edit Occurrence / Wave'
              : 'Schedule New Occurrence / Wave'}
          </h3>
          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={saving || uploadingImage}
          >
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
            <div className="form-row">
              <div className="admin-form-group">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <label style={{ margin: 0 }}>Parent Event / Program *</label>
                  {onOpenEventModal && (
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
                      onClick={onOpenEventModal}
                    >
                      + New Event
                    </button>
                  )}
                </div>

                {programs.length === 0 ? (
                  <div style={{ padding: '8px 0' }}>
                    <p style={{ fontSize: '0.85rem', color: '#dc2626', margin: '0 0 6px' }}>
                      No events found. Please create an event first.
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={onOpenEventModal}
                    >
                      + Create Event
                    </button>
                  </div>
                ) : (
                  <select
                    className="admin-select"
                    value={programId}
                    onChange={(e) => {
                      setProgramId(e.target.value);
                      const prog = programs.find((p) => p.id === e.target.value);
                      if (!occurrenceToEdit && prog) {
                        setSlug(generateSlug(prog.name, seasonName));
                      }
                    }}
                    required
                  >
                    <option value="" disabled>
                      Select an event ({programs.length} available)
                    </option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="admin-form-group">
                <label>Season / Round / Wave Name *</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. Wave 1, Summer 2026, Edition 2026"
                  value={seasonName}
                  onChange={(e) => {
                    setSeasonName(e.target.value);
                    if (!occurrenceToEdit) {
                      const prog = programs.find((p) => p.id === programId);
                      setSlug(generateSlug(prog?.name, e.target.value));
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="admin-form-group">
                <label>Slug (URL Key) *</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. backend-bootcamp-summer-2026"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Status</label>
                <select
                  className="admin-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="admin-form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  className="admin-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label>End Date</label>
                <input
                  type="date"
                  className="admin-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Banner Image Upload (Supabase Storage: event_cover) */}
            <div className="admin-form-group">
              <label>Event Banner Image (Supabase Storage: event_cover)</label>
              {coverImageUrl ? (
                <div className="banner-preview-compact">
                  <img
                    src={coverImageUrl}
                    alt="Banner Preview"
                    className="banner-preview-thumb"
                  />
                  <div className="banner-preview-details">
                    <div className="banner-preview-title">Event Banner Image</div>
                    <div className="banner-preview-status">
                      <span className="banner-status-dot"></span> Uploaded to Supabase (event_cover)
                    </div>
                  </div>
                  <div className="banner-preview-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm banner-action-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage || saving}
                    >
                      <UploadIcon size={14} />
                      <span>Change</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm banner-action-btn"
                      onClick={handleRemoveImage}
                      disabled={uploadingImage || saving}
                    >
                      <TrashIcon size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                      e.target.value = '';
                    }}
                    disabled={uploadingImage || saving}
                  />
                </div>
              ) : (
                <div
                  className={`banner-dropzone ${dragOver ? 'drag-over' : ''} ${
                    uploadingImage ? 'uploading' : ''
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  {uploadingImage ? (
                    <div className="banner-uploading-state">
                      <div className="banner-spinner"></div>
                      <p className="banner-dropzone-title">
                        Uploading image to Supabase Storage...
                      </p>
                      <p className="banner-dropzone-subtitle">Please wait a moment</p>
                    </div>
                  ) : (
                    <label className="banner-dropzone-label">
                      <div className="banner-dropzone-icon">
                        <UploadIcon size={28} />
                      </div>
                      <p className="banner-dropzone-title">
                        <strong>Click to browse</strong> or drag & drop event banner
                      </p>
                      <p className="banner-dropzone-subtitle">
                        PNG, JPG, WebP or GIF (Recommended 16:9, max 5MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="admin-form-group">
              <label>Description & Objectives</label>
              <textarea
                className="admin-textarea"
                placeholder="Full description of this occurrence/wave, schedule, prerequisites, venue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="form-row" style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f044c' }}>
                  Publish Event (Active on Public Site)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={applicationsOpen}
                    onChange={(e) => setApplicationsOpen(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f044c' }}>
                  Accept Applications (Form Open)
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving || uploadingImage}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || uploadingImage}
            >
              {uploadingImage
                ? 'Uploading Image...'
                : saving
                ? 'Saving...'
                : occurrenceToEdit
                ? 'Save Changes'
                : 'Create Occurrence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OccurrenceModal;
