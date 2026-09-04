import { Link } from 'react-router-dom';
import {
  BarChartIcon,
  CalendarIcon,
  FormIcon,
  UsersIcon,
  MailIcon,
  ShieldIcon,
  ArrowLeftIcon,
} from './AdminIcons';

function AdminSidebar({ activeTab, setActiveTab, counts, sidebarOpen, setSidebarOpen }) {
  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: BarChartIcon },
    { id: 'occurrences', label: 'Events & Occurrences', icon: CalendarIcon },
    { id: 'forms', label: 'Dynamic Form Builder', icon: FormIcon },
    {
      id: 'applications',
      label: 'Applications',
      icon: UsersIcon,
      badge: counts.pendingApplications > 0 ? counts.pendingApplications : null,
      badgeAlert: true,
    },
    {
      id: 'messages',
      label: 'Contact Inquiries',
      icon: MailIcon,
      badge: counts.unreadMessages > 0 ? counts.unreadMessages : null,
      badgeAlert: true,
    },
    { id: 'users', label: 'User Roles & Accounts', icon: ShieldIcon },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-subtitle">IEEE Alexandria SB</span>
        <h2 className="sidebar-title">Admin Command</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleTabClick(item.id)}
            >
              <div className="nav-item-content">
                <span className="nav-item-icon">
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span className={`sidebar-badge ${item.badgeAlert ? 'alert' : ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Link to="/" className="return-site-btn">
          <ArrowLeftIcon size={16} />
          <span>Back to Main Website</span>
        </Link>
      </div>
    </aside>
  );
}

export default AdminSidebar;
