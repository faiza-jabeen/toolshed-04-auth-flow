import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';

/**
 * Guards a branch of the route tree. Three states, and getting the first one
 * wrong is the classic bug: while the silent refresh is still in flight we are
 * neither signed in nor signed out, so redirecting here would bounce a valid
 * session to the login page on every hard reload.
 */
export function ProtectedRoute({ role }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'booting') {
    return (
      <div className="boot" role="status">
        <span className="spinner" /> Checking your session…
      </div>
    );
  }

  if (status !== 'authenticated') {
    // `state.from` is what lets login send them back where they were headed.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" replace state={{ denied: role }} />;
  }

  return <Outlet />;
}
