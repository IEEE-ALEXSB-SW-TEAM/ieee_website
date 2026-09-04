import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  RefreshIcon,
  CalendarIcon,
  FormIcon,
  UsersIcon,
  MailIcon,
} from './AdminIcons';

function OverviewTab({ setActiveTab, onRefreshCounts }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeEvents: 0,
    openApplications: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalMessages: 0,
    unreadMessages: 0,
    totalUsers: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadData() {
      try {
        // 1. Fetch occurrences stats
        const { data: occurrences } = await supabase
          .from('event_occurrences')
          .select('id, is_active, applications_open');

        if (!isCurrent) return;
        const activeCount = occurrences?.filter((o) => o.is_active).length || 0;
        const openCount = occurrences?.filter((o) => o.applications_open).length || 0;

        // 2. Fetch applications stats
        const { data: apps } = await supabase
          .from('applications')
          .select('id, status, created_at, user_id, occurrence_id, event_occurrences(season_name), profiles(full_name, email)')
          .order('created_at', { ascending: false });

        if (!isCurrent) return;
        const totalApps = apps?.length || 0;
        const pendingApps = apps?.filter((a) => (a.status || '').toLowerCase() === 'pending').length || 0;
        setRecentApplications((apps || []).slice(0, 5));

        // 3. Fetch contact messages stats
        const { data: msgs } = await supabase
          .from('contact_messages')
          .select('id, name, email, subject, is_read, created_at')
          .order('created_at', { ascending: false });

        if (!isCurrent) return;
        const totalMsgs = msgs?.length || 0;
        const unreadMsgs = msgs?.filter((m) => !m.is_read).length || 0;
        setRecentMessages((msgs || []).slice(0, 5));

        // 4. Fetch profiles count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });

        if (!isCurrent) return;

        setStats({
          activeEvents: activeCount,
          openApplications: openCount,
          totalApplications: totalApps,
          pendingApplications: pendingApps,
          totalMessages: totalMsgs,
          unreadMessages: unreadMsgs,
          totalUsers: userCount || 0,
        });

        if (onRefreshCounts) {
          onRefreshCounts({
            pendingApplications: pendingApps,
            unreadMessages: unreadMsgs,
          });
        }
      } catch (err) {
        console.error('Error fetching overview data:', err);
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
  }, [refreshIndex, onRefreshCounts]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading administrative dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="tab-header">
        <div>
          <h1 className="tab-header-title">Executive Dashboard</h1>
          <p className="tab-header-subtitle">
            Real-time branch statistics and ongoing activities.
          </p>
        </div>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <RefreshIcon size={16} />
            <span>Refresh Metrics</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Active Events</span>
          <div className="metric-value">{stats.activeEvents}</div>
          <span className="metric-sub">{stats.openApplications} accepting applications</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Applications</span>
          <div className="metric-value">{stats.totalApplications}</div>
          <span className="metric-sub" style={{ color: stats.pendingApplications > 0 ? '#b45309' : undefined }}>
            {stats.pendingApplications} pending review
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Contact Messages</span>
          <div className="metric-value">{stats.totalMessages}</div>
          <span className="metric-sub" style={{ color: stats.unreadMessages > 0 ? '#b91c1c' : undefined }}>
            {stats.unreadMessages} unread inquiries
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Registered Accounts</span>
          <div className="metric-value">{stats.totalUsers}</div>
          <span className="metric-sub">Student branch community</span>
        </div>
      </div>

      {/* Quick shortcuts */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Quick Actions</h3>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setActiveTab('occurrences')}>
            <CalendarIcon size={16} />
            <span>Manage Event Occurrences</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveTab('forms')}>
            <FormIcon size={16} />
            <span>Build Dynamic Application Form</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveTab('applications')}>
            <UsersIcon size={16} />
            <span>Review Pending Applications</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveTab('messages')}>
            <MailIcon size={16} />
            <span>Open Contact Inbox</span>
          </button>
        </div>
      </div>

      {/* Two columns for recent activity */}
      <div className="builder-columns">
        {/* Recent Applications */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Latest Applications</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('applications')}>
              View All
            </button>
          </div>
          {recentApplications.length === 0 ? (
            <p style={{ color: '#787a91', margin: 0 }}>No applications submitted yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Event</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <strong>{app.profiles?.full_name || 'Anonymous User'}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#787a91' }}>
                          {app.profiles?.email || ''}
                        </div>
                      </td>
                      <td>{app.event_occurrences?.season_name || 'Event'}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Inquiries */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recent Contact Inquiries</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('messages')}>
              View All
            </button>
          </div>
          {recentMessages.length === 0 ? (
            <p style={{ color: '#787a91', margin: 0 }}>No contact messages found.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Subject</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMessages.map((msg) => (
                    <tr key={msg.id}>
                      <td>
                        <strong>{msg.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#787a91' }}>{msg.email}</div>
                      </td>
                      <td>{msg.subject || 'No Subject'}</td>
                      <td>
                        <span className={`badge ${msg.is_read ? 'badge-neutral' : 'badge-danger'}`}>
                          {msg.is_read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;
