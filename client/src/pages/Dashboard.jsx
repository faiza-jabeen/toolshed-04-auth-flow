import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import { myLoans } from '../auth/api.js';

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [state, setState] = useState({ status: 'loading', data: [], error: null });

  useEffect(() => {
    let live = true;
    myLoans()
      .then((data) => live && setState({ status: 'ready', data, error: null }))
      .catch((error) => live && setState({ status: 'error', data: [], error }));
    return () => { live = false; };
  }, []);

  return (
    <main className="u-shell page">
      {location.state?.denied && (
        <p className="gate__alert" role="alert">
          That area is for {location.state.denied} accounts. Your account is a {user.role}.
        </p>
      )}

      <p className="eyebrow">Protected page</p>
      <h1 className="page__title">On loan to {user.name}.</h1>
      <p className="page__body u-measure">
        You reached this because a valid access token was attached to the request.
        Signing out revokes the refresh token server-side, so a copied cookie stops working too.
      </p>

      <div className="panel session">
        <h2 className="session__title">Your session</h2>
        <dl className="facts">
          <div className="facts__row"><dt>Name</dt><dd>{user.name}</dd></div>
          <div className="facts__row"><dt>Email</dt><dd>{user.email}</dd></div>
          <div className="facts__row"><dt>Role</dt><dd>{user.role}</dd></div>
          <div className="facts__row"><dt>Access token</dt><dd>held in memory, 15 minutes</dd></div>
          <div className="facts__row"><dt>Refresh token</dt><dd>httpOnly cookie, 7 days, rotated on use</dd></div>
        </dl>
      </div>

      {state.status === 'loading' && (
        <div className="rows">
          {[0, 1].map((i) => <div className="tag" key={i}>
            <div className="skeleton" style={{ height: '.7rem', width: '50%' }} />
            <div className="skeleton" style={{ height: '1.4rem', width: '70%', marginTop: '.7rem' }} />
          </div>)}
        </div>
      )}

      {state.status === 'error' && (
        <div className="state state--error" role="alert">
          <p className="state__title">Could not load your loans</p>
          <p className="state__body">{state.error.message}</p>
        </div>
      )}

      {state.status === 'ready' && state.data.length === 0 && (
        <div className="state">
          <p className="state__title">Nothing out at the moment</p>
          <p className="state__body">
            When you borrow something it appears here with its return date.
            Reserve from the catalogue during opening hours.
          </p>
        </div>
      )}

      {state.status === 'ready' && state.data.length > 0 && (
        <div className="rows">
          {state.data.map((loan) => (
            <article className="tag" key={loan.id}>
              <p className="tag__id"><span>{loan.assetTag}</span><span>Due {loan.dueOn}</span></p>
              <h3 className="tag__name">{loan.tool}</h3>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
