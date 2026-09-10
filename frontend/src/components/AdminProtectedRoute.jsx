import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../style/Admin.css';

function AdminProtectedRoute({ children }) {
  const { session, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Verifying administrative privileges...</p>
      </div>
    );
  }

  // If not logged in, redirect to login page
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in but not admin, redirect directly to home screen
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
