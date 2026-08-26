import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  return (
    <main className="u-shell home">
      <p className="eyebrow">Kirkgate · LS2</p>
      <h1 className="home__title">Own the hole.<br />Not the drill.</h1>
      <p className="home__body u-measure">
        This page is public. Everything behind <strong>My loans</strong> is not —
        try opening <code>/dashboard</code> while signed out and the guard will send
        you to sign in, then bring you straight back here afterwards.
      </p>
      <div className="home__actions">
        {isAuthenticated
          ? <Link className="btn btn--tape" to="/dashboard">Go to my loans, {user.name.split(' ')[0]}</Link>
          : <><Link className="btn btn--tape" to="/signup">Create an account</Link>
              <Link className="btn btn--ghost" to="/login">Sign in</Link></>}
      </div>
    </main>
  );
}
