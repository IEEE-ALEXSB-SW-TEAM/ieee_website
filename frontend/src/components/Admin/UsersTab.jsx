import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshIcon, PhoneIcon } from './AdminIcons';

function UsersTab({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'user'
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadUsers() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isCurrent) return;
        if (session?.user?.id) {
          setCurrentUserId(session.user.id);
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!isCurrent) return;
        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching user profiles:', err);
        showToast('Failed to load registered users', 'error');
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isCurrent = false;
    };
  }, [refreshIndex, showToast]);

  const refreshUsers = () => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.id === currentUserId && newRole !== 'admin') {
      showToast('You cannot demote your own account from admin.', 'error');
      return;
    }

    if (!window.confirm(`Change role of "${targetUser.full_name || targetUser.email}" to "${newRole}"?`)) {
      return;
    }

    setUpdatingId(targetUser.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUser.id);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      showToast(`User role updated to ${newRole}`);
    } catch (err) {
      console.error('Error updating user role:', err);
      showToast(err.message || 'Failed to update user role', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && (u.role || 'user').toLowerCase() !== roleFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading registered accounts and roles...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="tab-header">
        <div>
          <h1 className="tab-header-title">User Roles & Accounts</h1>
          <p className="tab-header-subtitle">
            Manage user accounts, contact information, and administrative privileges.
          </p>
        </div>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={refreshUsers}>
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
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#787a91' }}>Role:</label>
          <select
            className="admin-select"
            style={{ width: 'auto' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="admin">
              Admins ({users.filter((u) => (u.role || '').toLowerCase() === 'admin').length})
            </option>
            <option value="user">
              Regular Users ({users.filter((u) => (u.role || 'user').toLowerCase() === 'user').length})
            </option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        {filteredUsers.length === 0 ? (
          <p style={{ color: '#787a91', margin: 0 }}>No users match the query.</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact Info</th>
                  <th>Registered</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isCurrentUser = user.id === currentUserId;
                  const currentRole = (user.role || 'user').toLowerCase();

                  return (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.full_name || 'Member'}</strong>
                        {isCurrentUser && (
                          <span
                            className="badge badge-neutral"
                            style={{ marginLeft: '8px', fontSize: '0.7rem' }}
                          >
                            You
                          </span>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#787a91', marginTop: '2px' }}>
                          <code>{user.id.slice(0, 16)}...</code>
                        </div>
                      </td>
                      <td>
                        <div>{user.email || '—'}</div>
                        {user.phone && (
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: '#787a91',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginTop: '2px',
                            }}
                          >
                            <PhoneIcon size={13} />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#787a91' }}>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            currentRole === 'admin' ? 'badge-info' : 'badge-neutral'
                          }`}
                        >
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <select
                          className="admin-select"
                          style={{ width: 'auto', display: 'inline-block', fontSize: '0.85rem' }}
                          disabled={updatingId === user.id || (isCurrentUser && currentRole === 'admin')}
                          value={currentRole}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default UsersTab;
