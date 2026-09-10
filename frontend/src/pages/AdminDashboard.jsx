import { useState, useCallback } from 'react';
import AdminSidebar from '../components/Admin/AdminSidebar';
import OverviewTab from '../components/Admin/OverviewTab';
import OccurrencesTab from '../components/Admin/OccurrencesTab';
import FormBuilderTab from '../components/Admin/FormBuilderTab';
import ApplicationsTab from '../components/Admin/ApplicationsTab';
import MessagesTab from '../components/Admin/MessagesTab';
import UsersTab from '../components/Admin/UsersTab';
import { CheckIcon, AlertTriangleIcon, MenuIcon } from '../components/Admin/AdminIcons';
import '../style/Admin.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFormOccurrenceId, setSelectedFormOccurrenceId] = useState(null);

  // Badge counters
  const [counts, setCounts] = useState({
    pendingApplications: 0,
    unreadMessages: 0,
  });

  // Toast alert
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const updateCounts = (newCounts) => {
    setCounts((prev) => ({ ...prev, ...newCounts }));
  };

  const handleSelectFormOccurrence = (occurrenceId) => {
    setSelectedFormOccurrenceId(occurrenceId);
    setActiveTab('forms');
  };

  return (
    <div className="admin-layout">
      {/* Toast alert */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {toast.type === 'success' ? <CheckIcon size={16} /> : <AlertTriangleIcon size={16} />}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Workspace */}
      <main className="admin-main">
        {/* Mobile toggle button */}
        <button
          className="mobile-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <MenuIcon size={18} />
          <span>{sidebarOpen ? 'Close Menu' : 'Admin Navigation'}</span>
        </button>

        {activeTab === 'overview' && (
          <OverviewTab setActiveTab={setActiveTab} onRefreshCounts={updateCounts} />
        )}

        {(activeTab === 'occurrences' || activeTab === 'categories') && (
          <OccurrencesTab
            showToast={showToast}
            onSelectFormOccurrence={handleSelectFormOccurrence}
            initialSubView="occurrences"
          />
        )}

        {activeTab === 'forms' && (
          <FormBuilderTab
            showToast={showToast}
            initialOccurrenceId={selectedFormOccurrenceId}
          />
        )}

        {activeTab === 'applications' && (
          <ApplicationsTab showToast={showToast} onRefreshCounts={updateCounts} />
        )}

        {activeTab === 'messages' && (
          <MessagesTab showToast={showToast} onRefreshCounts={updateCounts} />
        )}

        {activeTab === 'users' && <UsersTab showToast={showToast} />}
      </main>
    </div>
  );
}

export default AdminDashboard;
