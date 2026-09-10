import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshIcon, CheckIcon } from './AdminIcons';

function ApplicationsTab({ showToast, onRefreshCounts }) {
  const [applications, setApplications] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedOccurrenceFilter, setSelectedOccurrenceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Inspection modal
  const [inspectingApp, setInspectingApp] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadData() {
      try {
        const { data: occs } = await supabase
          .from('event_occurrences')
          .select('id, season_name, form_schema, event_programs(name)')
          .order('created_at', { ascending: false });

        if (!isCurrent) return;
        setOccurrences(occs || []);

        const { data: apps, error } = await supabase
          .from('applications')
          .select(`
            id,
            occurrence_id,
            user_id,
            status,
            responses,
            created_at,
            updated_at,
            event_occurrences (
              id,
              season_name,
              form_schema,
              event_programs ( name )
            ),
            profiles (
              id,
              full_name,
              email,
              phone
            )
          `)
          .order('created_at', { ascending: false });

        if (!isCurrent) return;
        if (error) throw error;
        setApplications(apps || []);

        const pendingCount = (apps || []).filter((a) => (a.status || '').toLowerCase() === 'pending').length;
        if (onRefreshCounts) {
          onRefreshCounts({ pendingApplications: pendingCount });
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
        showToast('Failed to load applications', 'error');
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
  }, [refreshIndex, onRefreshCounts, showToast]);

  const refreshData = () => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appId);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );

      if (inspectingApp && inspectingApp.id === appId) {
        setInspectingApp({ ...inspectingApp, status: newStatus });
      }

      showToast(`Application marked as ${newStatus}`);
    } catch (err) {
      console.error('Error updating application status:', err);
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this applicant submission?')) {
      return;
    }

    try {
      const { error } = await supabase.from('applications').delete().eq('id', appId);
      if (error) throw error;
      showToast('Application deleted');
      setInspectingApp(null);
      refreshData();
    } catch (err) {
      console.error('Error deleting application:', err);
      showToast(err.message || 'Failed to delete application', 'error');
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (selectedOccurrenceFilter !== 'all' && app.occurrence_id !== selectedOccurrenceFilter) {
      return false;
    }
    if (statusFilter !== 'all' && (app.status || 'pending').toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (app.profiles?.full_name || '').toLowerCase();
      const email = (app.profiles?.email || '').toLowerCase();
      const phone = (app.profiles?.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading applications and submissions...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="tab-header">
        <div>
          <h1 className="tab-header-title">Application Submissions</h1>
          <p className="tab-header-subtitle">
            Review applicant responses, verify contact information, and accept or reject candidates.
          </p>
        </div>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={refreshData}>
            <RefreshIcon size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="search-filter-bar">
        <input
          type="text"
          className="admin-input search-input"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#787a91' }}>Event:</label>
          <select
            className="admin-select"
            style={{ width: 'auto' }}
            value={selectedOccurrenceFilter}
            onChange={(e) => setSelectedOccurrenceFilter(e.target.value)}
          >
            <option value="all">All Events ({applications.length})</option>
            {occurrences.map((o) => (
              <option key={o.id} value={o.id}>
                {o.event_programs?.name} — {o.season_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#787a91' }}>Status:</label>
          <select
            className="admin-select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="admin-card">
        {filteredApplications.length === 0 ? (
          <p style={{ color: '#787a91', margin: 0 }}>
            No submissions match the selected filters.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Target Event</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => {
                  const applicantName = app.profiles?.full_name || 'Anonymous User';
                  const applicantEmail = app.profiles?.email || 'No email';
                  const eventTitle = `${app.event_occurrences?.event_programs?.name || 'Program'} — ${
                    app.event_occurrences?.season_name || ''
                  }`;

                  return (
                    <tr key={app.id}>
                      <td>
                        <strong>{applicantName}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#787a91' }}>
                          {applicantEmail}
                          {app.profiles?.phone && ` • ${app.profiles.phone}`}
                        </div>
                      </td>
                      <td>{eventTitle}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {app.created_at
                          ? new Date(app.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            app.status === 'approved'
                              ? 'badge-success'
                              : app.status === 'rejected'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                        >
                          {app.status || 'pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setInspectingApp(app)}
                        >
                          Inspect Application →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspector Modal */}
      {inspectingApp && (
        <div className="modal-backdrop">
          <div className="modal-content large">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  Application: {inspectingApp.profiles?.full_name || 'Applicant'}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#787a91' }}>
                  {inspectingApp.event_occurrences?.event_programs?.name} —{' '}
                  {inspectingApp.event_occurrences?.season_name}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setInspectingApp(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              {/* Applicant Profile Summary */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <span className="response-question">Email</span>
                  <div style={{ fontSize: '0.92rem', color: '#0f044c' }}>
                    {inspectingApp.profiles?.email || 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="response-question">Phone</span>
                  <div style={{ fontSize: '0.92rem', color: '#0f044c' }}>
                    {inspectingApp.profiles?.phone || 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="response-question">Submitted</span>
                  <div style={{ fontSize: '0.92rem', color: '#0f044c' }}>
                    {new Date(inspectingApp.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="response-question">Current Status</span>
                  <div>
                    <span
                      className={`badge ${
                        inspectingApp.status === 'approved'
                          ? 'badge-success'
                          : inspectingApp.status === 'rejected'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {inspectingApp.status || 'pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Question Responses */}
              <h4 style={{ color: '#0f044c', margin: '0 0 16px', fontSize: '1.05rem' }}>
                Form Responses
              </h4>

              {(() => {
                const schema = inspectingApp.event_occurrences?.form_schema || [];
                const responses = inspectingApp.responses || {};

                if (schema.length === 0 && Object.keys(responses).length === 0) {
                  return <p style={{ color: '#787a91' }}>No responses recorded.</p>;
                }

                if (schema.length > 0) {
                  return schema.map((field) => {
                    const ans = responses[field.id];
                    let formattedAns = '—';
                    if (ans !== undefined && ans !== null && ans !== '') {
                      if (typeof ans === 'boolean') {
                        formattedAns = ans ? 'Yes' : 'No';
                      } else {
                        formattedAns = String(ans);
                      }
                    }

                    return (
                      <div className="response-item" key={field.id}>
                        <div className="response-question">{field.label}</div>
                        <div className="response-answer">{formattedAns}</div>
                      </div>
                    );
                  });
                }

                // Fallback if schema is missing but responses JSON has keys
                return Object.entries(responses).map(([key, val]) => (
                  <div className="response-item" key={key}>
                    <div className="response-question">{key}</div>
                    <div className="response-answer">{String(val)}</div>
                  </div>
                ));
              })()}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteApplication(inspectingApp.id)}
              >
                Delete Application
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus(inspectingApp.id, 'pending')}
                >
                  Set Pending
                </button>
                <button
                  className="btn btn-danger"
                  style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus(inspectingApp.id, 'rejected')}
                >
                  Reject
                </button>
                <button
                  className="btn btn-primary"
                  style={{ backgroundColor: '#15803d' }}
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus(inspectingApp.id, 'approved')}
                >
                  <CheckIcon size={16} />
                  <span>Approve Application</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationsTab;
