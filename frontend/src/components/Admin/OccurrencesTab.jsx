import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  FormIcon,
  EditIcon,
  TrashIcon,
  ImageIcon,
  FolderIcon,
  CalendarIcon,
} from './AdminIcons';
import CategoryModal from './modals/CategoryModal';
import EventModal from './modals/EventModal';
import OccurrenceModal from './modals/OccurrenceModal';

function OccurrencesTab({
  showToast,
  onSelectFormOccurrence,
  initialSubView = 'occurrences',
}) {
  const [occurrences, setOccurrences] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProgram, setFilterProgram] = useState('all');

  // Sub-view switcher: 'occurrences' | 'events' | 'categories'
  const [activeSubView, setActiveSubView] = useState(initialSubView);

  // Modal open states & edit targets
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState(null);

  const [isOccurrenceModalOpen, setIsOccurrenceModalOpen] = useState(false);
  const [occurrenceToEdit, setOccurrenceToEdit] = useState(null);
  const [preselectedProgramId, setPreselectedProgramId] = useState(null);

  const [refreshIndex, setRefreshIndex] = useState(0);

  // Keep activeSubView aligned if initialSubView prop changes
  useEffect(() => {
    if (initialSubView) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView]);

  const refreshData = () => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  };

  useEffect(() => {
    let isCurrent = true;

    async function loadData() {
      try {
        const [catsRes, progsRes, occsRes] = await Promise.all([
          supabase
            .from('event_categories')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true }),
          supabase
            .from('event_programs')
            .select('*, event_categories(name)')
            .order('name', { ascending: true }),
          supabase
            .from('event_occurrences')
            .select('*, event_programs(name, category_id, event_categories(name))')
            .order('created_at', { ascending: false }),
        ]);

        if (!isCurrent) return;

        if (catsRes.error) throw catsRes.error;
        if (progsRes.error) throw progsRes.error;
        if (occsRes.error) throw occsRes.error;

        setCategories(catsRes.data || []);
        setPrograms(progsRes.data || []);
        setOccurrences(occsRes.data || []);
      } catch (err) {
        console.error('Error loading events data:', err);
        showToast('Failed to load event data', 'error');
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCurrent = false;
    };
  }, [refreshIndex]);

  // Modal opener handlers
  const handleOpenCategoryModal = (category = null) => {
    setCategoryToEdit(category);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEventModal = (event = null, preCatId = null) => {
    setEventToEdit(event);
    setPreselectedCategoryId(preCatId || event?.category_id || null);
    setIsOccurrenceModalOpen(false);
    setIsEventModalOpen(true);
  };

  const handleOpenOccurrenceModal = (occurrence = null, preProgId = null) => {
    setOccurrenceToEdit(occurrence);
    setPreselectedProgramId(preProgId || occurrence?.program_id || null);
    setIsOccurrenceModalOpen(true);
  };

  // Toggle active state
  const handleToggleActive = async (occ) => {
    try {
      const newValue = !occ.is_active;
      const { error } = await supabase
        .from('event_occurrences')
        .update({ is_active: newValue, updated_at: new Date().toISOString() })
        .eq('id', occ.id);

      if (error) throw error;
      setOccurrences((prev) =>
        prev.map((o) => (o.id === occ.id ? { ...o, is_active: newValue } : o))
      );
      showToast(`Event occurrence is now ${newValue ? 'Active' : 'Inactive'}`);
    } catch (err) {
      console.error('Error toggling active state:', err);
      showToast('Failed to update active state', 'error');
    }
  };

  // Toggle applications open
  const handleToggleApplications = async (occ) => {
    try {
      const newValue = !occ.applications_open;
      const { error } = await supabase
        .from('event_occurrences')
        .update({ applications_open: newValue, updated_at: new Date().toISOString() })
        .eq('id', occ.id);

      if (error) throw error;
      setOccurrences((prev) =>
        prev.map((o) => (o.id === occ.id ? { ...o, applications_open: newValue } : o))
      );
      showToast(`Applications are now ${newValue ? 'Open' : 'Closed'}`);
    } catch (err) {
      console.error('Error toggling applications state:', err);
      showToast('Failed to update applications state', 'error');
    }
  };

  // Delete category
  const handleDeleteCategory = async (id, name) => {
    const linkedCount = programs.filter((p) => p.category_id === id).length;
    const confirmMsg =
      linkedCount > 0
        ? `Delete category "${name}"? Warning: There are ${linkedCount} event(s) associated with this category.`
        : `Delete category "${name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('event_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast(`Category "${name}" deleted`);
      refreshData();
    } catch (err) {
      console.error('Error deleting category:', err);
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  // Delete event (program)
  const handleDeleteEvent = async (id, name) => {
    const linkedCount = occurrences.filter((o) => o.program_id === id).length;
    const confirmMsg =
      linkedCount > 0
        ? `Delete event "${name}"? Warning: There are ${linkedCount} occurrence(s) scheduled for this event.`
        : `Delete event "${name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('event_programs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast(`Event "${name}" deleted`);
      refreshData();
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast(err.message || 'Failed to delete event', 'error');
    }
  };

  // Delete occurrence & clean up image from storage
  const handleDeleteOccurrence = async (id, name) => {
    if (
      !window.confirm(
        `Delete occurrence "${name}"? This will also remove any linked applications.`
      )
    ) {
      return;
    }
    try {
      const occ = occurrences.find((o) => o.id === id);
      if (occ?.cover_image_url && occ.cover_image_url.includes('event_cover')) {
        try {
          const path = occ.cover_image_url.split('/event_cover/')[1]?.split('?')[0];
          if (path) {
            await supabase.storage
              .from('event_cover')
              .remove([decodeURIComponent(path)]);
          }
        } catch (e) {
          console.error('Error removing occurrence image from storage:', e);
        }
      }

      const { error } = await supabase
        .from('event_occurrences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Occurrence deleted');
      refreshData();
    } catch (err) {
      console.error('Error deleting occurrence:', err);
      showToast(err.message || 'Failed to delete occurrence', 'error');
    }
  };

  const filteredOccurrences = occurrences.filter((occ) => {
    if (filterProgram !== 'all' && occ.program_id !== filterProgram) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading events & occurrences...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Header with 3 Dedicated Actions */}
      <div className="tab-header">
        <div>
          <h1 className="tab-header-title">Events & Occurrences</h1>
          <p className="tab-header-subtitle">
            Manage your 3-tier event hierarchy: Tracks & Categories, Events (Programs), and specific Occurrences (Waves).
          </p>
        </div>

        <div
          className="tab-actions"
          style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => handleOpenCategoryModal(null)}
            title="Create a new event track / category"
          >
            + New Category
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleOpenEventModal(null)}
            title="Create a new event identity under a category"
          >
            + New Event
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleOpenOccurrenceModal(null)}
            title="Schedule a specific round or wave with banner and dates"
          >
            + New Occurrence
          </button>
        </div>
      </div>

      {/* 3-Tier View Switcher */}
      <div className="admin-subnav-tabs">
        <button
          type="button"
          className={`admin-subnav-tab ${activeSubView === 'occurrences' ? 'active' : ''}`}
          onClick={() => setActiveSubView('occurrences')}
        >
          <span>Occurrences / Waves</span>
          <span className="admin-subnav-badge">{occurrences.length}</span>
        </button>
        <button
          type="button"
          className={`admin-subnav-tab ${activeSubView === 'events' ? 'active' : ''}`}
          onClick={() => setActiveSubView('events')}
        >
          <span>Events / Programs</span>
          <span className="admin-subnav-badge">{programs.length}</span>
        </button>
        <button
          type="button"
          className={`admin-subnav-tab ${activeSubView === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveSubView('categories')}
        >
          <span>Categories</span>
          <span className="admin-subnav-badge">{categories.length}</span>
        </button>
      </div>

      {/* ================= VIEW 1: OCCURRENCES ================= */}
      {activeSubView === 'occurrences' && (
        <>
          {/* Filter Bar */}
          <div className="search-filter-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#787a91' }}>
                Filter by Event / Program:
              </label>
              <select
                className="admin-select"
                style={{ width: 'auto' }}
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
              >
                <option value="all">All Events ({occurrences.length})</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-card">
            {filteredOccurrences.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center' }}>
                <p style={{ color: '#787a91', marginBottom: '16px' }}>
                  No event occurrences found. You can create a category, define an event, or schedule an occurrence.
                </p>
                <div style={{ display: 'inline-flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenCategoryModal(null)}
                  >
                    + New Category
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEventModal(null)}
                  >
                    + New Event
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenOccurrenceModal(null)}
                  >
                    + New Occurrence
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Event / Occurrence</th>
                      <th>Status</th>
                      <th>Dates</th>
                      <th>Active</th>
                      <th>Apps Open</th>
                      <th>Form</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOccurrences.map((occ) => {
                      const programName = occ.event_programs?.name || 'Event';
                      const categoryName = occ.event_programs?.event_categories?.name;
                      const questionsCount = Array.isArray(occ.form_schema)
                        ? occ.form_schema.length
                        : 0;

                      return (
                        <tr key={occ.id}>
                          <td>
                            <div className="occ-title-cell">
                              {occ.cover_image_url ? (
                                <img
                                  src={occ.cover_image_url}
                                  alt={occ.season_name}
                                  className="occ-table-thumb"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="occ-table-thumb-placeholder">
                                  <ImageIcon size={18} />
                                </div>
                              )}
                              <div>
                                <strong>{programName}</strong> —{' '}
                                <span>{occ.season_name}</span>
                                <div
                                  style={{
                                    fontSize: '0.78rem',
                                    color: '#787a91',
                                    marginTop: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  {categoryName && (
                                    <span className="category-tag-badge">
                                      {categoryName}
                                    </span>
                                  )}
                                  <span>/{occ.slug}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {(() => {
                              const s = (occ.status || '').toLowerCase();
                              const badgeClass =
                                s === 'active' || s === 'ongoing'
                                  ? 'badge-success'
                                  : s === 'upcoming'
                                  ? 'badge-info'
                                  : s === 'completed'
                                  ? 'badge-secondary'
                                  : 'badge-warning';
                              const label = occ.status
                                ? occ.status.charAt(0).toUpperCase() + occ.status.slice(1)
                                : '—';
                              return <span className={`badge ${badgeClass}`}>{label}</span>;
                            })()}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                              <div>
                                Start: {occ.start_date ? new Date(occ.start_date).toLocaleDateString() : '—'}
                              </div>
                              <div style={{ color: '#787a91' }}>
                                End: {occ.end_date ? new Date(occ.end_date).toLocaleDateString() : '—'}
                              </div>
                            </div>
                          </td>
                          <td>
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={occ.is_active}
                                onChange={() => handleToggleActive(occ)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </td>
                          <td>
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={occ.applications_open}
                                onChange={() => handleToggleApplications(occ)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => onSelectFormOccurrence(occ.id)}
                              title="Edit Application Questions in Form Builder"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                              <FormIcon size={14} />
                              <span>
                                {questionsCount > 0 ? `${questionsCount} Qs` : 'Configure'}
                              </span>
                            </button>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="table-actions">
                              <button
                                className="btn-icon"
                                title="Edit Occurrence"
                                onClick={() => handleOpenOccurrenceModal(occ)}
                              >
                                <EditIcon size={15} />
                              </button>
                              <button
                                className="btn-icon delete"
                                title="Delete Occurrence"
                                onClick={() =>
                                  handleDeleteOccurrence(
                                    occ.id,
                                    `${programName} — ${occ.season_name}`
                                  )
                                }
                              >
                                <TrashIcon size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= VIEW 2: EVENTS / PROGRAMS ================= */}
      {activeSubView === 'events' && (
        <div className="admin-card">
          {programs.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center' }}>
              <p style={{ color: '#787a91', marginBottom: '16px' }}>
                No events or programs defined yet. Start by defining an event under a category!
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleOpenEventModal(null)}
              >
                + Create First Event
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event / Program Name</th>
                    <th>Category Track</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th>Scheduled Waves</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map((prog) => {
                    const waveCount = occurrences.filter(
                      (o) => o.program_id === prog.id
                    ).length;
                    const categoryName =
                      prog.event_categories?.name || 'Uncategorized';

                    return (
                      <tr key={prog.id}>
                        <td>
                          <strong>{prog.name}</strong>
                        </td>
                        <td>
                          <span className="category-tag-badge">{categoryName}</span>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.8rem', color: '#141e61' }}>
                            /{prog.slug}
                          </code>
                        </td>
                        <td style={{ maxWidth: '280px' }}>
                          <span
                            style={{
                              fontSize: '0.83rem',
                              color: '#64748b',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {prog.description || 'No description provided'}
                          </span>
                        </td>
                        <td>
                          <span className="count-pill-badge">
                            {waveCount} {waveCount === 1 ? 'Wave' : 'Waves'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div
                            className="table-actions"
                            style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}
                          >
                            <button
                              type="button"
                              className="quick-add-link-btn"
                              onClick={() => handleOpenOccurrenceModal(null, prog.id)}
                              title={`Schedule a new wave for ${prog.name}`}
                            >
                              + Wave
                            </button>
                            <button
                              className="btn-icon"
                              title="Edit Event"
                              onClick={() => handleOpenEventModal(prog)}
                            >
                              <EditIcon size={15} />
                            </button>
                            <button
                              className="btn-icon delete"
                              title="Delete Event"
                              onClick={() => handleDeleteEvent(prog.id, prog.name)}
                            >
                              <TrashIcon size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 3: CATEGORIES ================= */}
      {activeSubView === 'categories' && (
        <div className="admin-card">
          {categories.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center' }}>
              <p style={{ color: '#787a91', marginBottom: '16px' }}>
                No categories created yet. Create categories like "Technical Bootcamps", "Competitions", or "Workshops".
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleOpenCategoryModal(null)}
              >
                + Create First Category
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Order</th>
                    <th>Category Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th>Events Count</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => {
                    const linkedProgCount = programs.filter(
                      (p) => p.category_id === cat.id
                    ).length;

                    return (
                      <tr key={cat.id}>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              color: '#787a91',
                              fontSize: '0.85rem',
                            }}
                          >
                            #{cat.sort_order ?? 0}
                          </span>
                        </td>
                        <td>
                          <strong>{cat.name}</strong>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.8rem', color: '#141e61' }}>
                            /{cat.slug}
                          </code>
                        </td>
                        <td style={{ maxWidth: '320px' }}>
                          <span
                            style={{
                              fontSize: '0.83rem',
                              color: '#64748b',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {cat.description || 'No description provided'}
                          </span>
                        </td>
                        <td>
                          <span className="count-pill-badge">
                            {linkedProgCount} {linkedProgCount === 1 ? 'Event' : 'Events'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div
                            className="table-actions"
                            style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}
                          >
                            <button
                              type="button"
                              className="quick-add-link-btn"
                              onClick={() => handleOpenEventModal(null, cat.id)}
                              title={`Create an event under ${cat.name}`}
                            >
                              + Event
                            </button>
                            <button
                              className="btn-icon"
                              title="Edit Category"
                              onClick={() => handleOpenCategoryModal(cat)}
                            >
                              <EditIcon size={15} />
                            </button>
                            <button
                              className="btn-icon delete"
                              title="Delete Category"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            >
                              <TrashIcon size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Category Modal (event_categories) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryToEdit(null);
        }}
        onSuccess={() => {
          refreshData();
        }}
        categoryToEdit={categoryToEdit}
        showToast={showToast}
      />

      {/* 2. Event Modal (event_programs) */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
          setPreselectedCategoryId(null);
        }}
        onSuccess={() => {
          refreshData();
        }}
        onOpenCategoryModal={() => {
          setIsEventModalOpen(false);
          setCategoryToEdit(null);
          setIsCategoryModalOpen(true);
        }}
        categories={categories}
        eventToEdit={eventToEdit}
        preselectedCategoryId={preselectedCategoryId}
        showToast={showToast}
      />

      {/* 3. Occurrence Modal (event_occurrences) */}
      <OccurrenceModal
        isOpen={isOccurrenceModalOpen}
        onClose={() => {
          setIsOccurrenceModalOpen(false);
          setOccurrenceToEdit(null);
          setPreselectedProgramId(null);
        }}
        onSuccess={() => {
          refreshData();
        }}
        onOpenEventModal={() => {
          setIsOccurrenceModalOpen(false);
          setEventToEdit(null);
          setIsEventModalOpen(true);
        }}
        programs={programs}
        occurrenceToEdit={occurrenceToEdit}
        preselectedProgramId={preselectedProgramId}
        showToast={showToast}
      />
    </div>
  );
}

export default OccurrencesTab;
