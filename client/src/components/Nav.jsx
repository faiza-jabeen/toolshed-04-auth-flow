import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';

export function Nav() {
  const { isAuthenticated, user, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    try { await logout(); } finally { setBusy(false); }
  };

  return (
    <header className="masthead">
      <div className="u-shell masthead__inner">
        <Link className="wordmark" to="/">
          <span className="wordmark__mark">TS</span>
          <span className="wordmark__text">Kirkgate<br /><em>Toolshed</em></span>
        </Link>

        <nav className="masthead__nav" aria-label="Primary">
          <NavLink className="masthead__link" to="/">Home</NavLink>
          {isAuthenticated && <NavLink className="masthead__link" to="/dashboard">My loans</NavLink>}
          {user?.role === 'keeper' && <NavLink className="masthead__link" to="/keeper">Keeper</NavLink>}

          {isAuthenticated ? (
            <>
              <span className="masthead__who">{user.name}</span>
              <button className="btn btn--ghost btn--sm btn--on-dark" onClick={signOut} disabled={busy}>
                {busy && <span className="spinner" />}{busy ? 'Signing out…' : 'Sign out'}
              </button>
            </>
          ) : (
            <>
              <NavLink className="masthead__link" to="/login">Sign in</NavLink>
              <Link className="btn btn--tape btn--sm" to="/signup">Join</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
