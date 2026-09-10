import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshIcon, MailIcon, EyeIcon, TrashIcon } from './AdminIcons';

function MessagesTab({ showToast, onRefreshCounts }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRead, setFilterRead] = useState('all'); // 'all' | 'unread' | 'read'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMessage, setActiveMessage] = useState(null);

  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadMessages() {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (!isCurrent) return;
        if (error) throw error;
        setMessages(data || []);

        const unreadCount = (data || []).filter((m) => !m.is_read).length;
        if (onRefreshCounts) {
          onRefreshCounts({ unreadMessages: unreadCount });
        }
      } catch (err) {
        console.error('Error fetching contact messages:', err);
        showToast('Failed to load contact inquiries', 'error');
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      isCurrent = false;
    };
  }, [refreshIndex, onRefreshCounts, showToast]);

  const refreshMessages = () => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  };

  const handleToggleRead = async (msgId, currentRead) => {
    try {
      const newRead = !currentRead;
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: newRead })
        .eq('id', msgId);

      if (error) throw error;

      const updated = messages.map((m) => (m.id === msgId ? { ...m, is_read: newRead } : m));
      setMessages(updated);

      if (activeMessage && activeMessage.id === msgId) {
        setActiveMessage({ ...activeMessage, is_read: newRead });
      }

      const unreadCount = updated.filter((m) => !m.is_read).length;
      if (onRefreshCounts) {
        onRefreshCounts({ unreadMessages: unreadCount });
      }

      showToast(`Message marked as ${newRead ? 'Read' : 'Unread'}`);
    } catch (err) {
      console.error('Error toggling message read state:', err);
      showToast('Failed to update message status', 'error');
    }
  };

  const handleOpenMessage = async (msg) => {
    setActiveMessage(msg);
    // Automatically mark as read if it was unread
    if (!msg.is_read) {
      handleToggleRead(msg.id, false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', msgId);
      if (error) throw error;
      showToast('Message deleted');
      setActiveMessage(null);
      refreshMessages();
    } catch (err) {
      console.error('Error deleting message:', err);
      showToast(err.message || 'Failed to delete message', 'error');
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filterRead === 'unread' && msg.is_read) return false;
    if (filterRead === 'read' && !msg.is_read) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (msg.name || '').toLowerCase().includes(q) ||
        (msg.email || '').toLowerCase().includes(q) ||
        (msg.subject || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading contact messages...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="tab-header">
        <div>
          <h1 className="tab-header-title">Contact Inquiries</h1>
          <p className="tab-header-subtitle">
            Messages received via the website contact form.
          </p>
        </div>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={refreshMessages}>
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
          placeholder="Search by name, email, or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`btn btn-sm ${filterRead === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterRead('all')}
          >
            All ({messages.length})
          </button>
          <button
            className={`btn btn-sm ${filterRead === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterRead('unread')}
          >
            Unread ({messages.filter((m) => !m.is_read).length})
          </button>
          <button
            className={`btn btn-sm ${filterRead === 'read' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterRead('read')}
          >
            Read ({messages.filter((m) => m.is_read).length})
          </button>
        </div>
      </div>

      {/* Messages Table */}
      <div className="admin-card">
        {filteredMessages.length === 0 ? (
          <p style={{ color: '#787a91', margin: 0 }}>No contact messages found.</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((msg) => (
                  <tr
                    key={msg.id}
                    style={{
                      fontWeight: msg.is_read ? 400 : 600,
                      backgroundColor: msg.is_read ? undefined : 'rgba(20, 30, 97, 0.03)',
                    }}
                  >
                    <td>
                      <span className={`badge ${msg.is_read ? 'badge-neutral' : 'badge-danger'}`}>
                        {msg.is_read ? 'Read' : 'New'}
                      </span>
                    </td>
                    <td>
                      <div>{msg.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#787a91' }}>{msg.email}</div>
                    </td>
                    <td>{msg.subject || 'No Subject'}</td>
                    <td style={{ fontSize: '0.85rem', color: '#787a91' }}>
                      {new Date(msg.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenMessage(msg)}
                        >
                          Read Message →
                        </button>
                        <button
                          className="btn-icon"
                          title={msg.is_read ? 'Mark as Unread' : 'Mark as Read'}
                          onClick={() => handleToggleRead(msg.id, msg.is_read)}
                        >
                          {msg.is_read ? <MailIcon size={15} /> : <EyeIcon size={15} />}
                        </button>
                        <button
                          className="btn-icon delete"
                          title="Delete Message"
                          onClick={() => handleDeleteMessage(msg.id)}
                        >
                          <TrashIcon size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {activeMessage && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{activeMessage.subject || 'Contact Inquiry'}</h3>
                <span style={{ fontSize: '0.82rem', color: '#787a91' }}>
                  From: {activeMessage.name} &lt;{activeMessage.email}&gt;
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveMessage(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: '0.85rem', color: '#787a91', marginBottom: '16px' }}>
                Sent on {new Date(activeMessage.created_at).toLocaleString()}
              </div>
              <div
                style={{
                  background: '#f8fafc',
                  padding: '18px',
                  borderRadius: '8px',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                  color: '#0f044c',
                }}
              >
                {activeMessage.message}
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteMessage(activeMessage.id)}
              >
                Delete
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleToggleRead(activeMessage.id, activeMessage.is_read)}
                >
                  {activeMessage.is_read ? 'Mark Unread' : 'Mark Read'}
                </button>
                <a
                  href={`mailto:${activeMessage.email}?subject=Re: ${encodeURIComponent(
                    activeMessage.subject || 'IEEE Alexandria Inquiry'
                  )}`}
                  className="btn btn-primary"
                >
                  <MailIcon size={16} />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesTab;
