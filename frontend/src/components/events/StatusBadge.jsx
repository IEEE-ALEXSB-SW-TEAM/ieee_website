const statusLabels = { open: "Open", closed: "Closed", upcoming: "Upcoming", completed: "Completed" };

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{statusLabels[status] || status}</span>;
}

export default StatusBadge;