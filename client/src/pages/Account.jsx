import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import { api } from '../auth/api.js';

/** The protected page. Reached only with a valid access token. */
export default function Account() {
  const { user } = useAuth();
  const location = useLocation();
  const [state, setState] = useState({ status: 'loading', loans: [], error: null });

  useEffect(() => {
    let live = true;
    api.myLoans()
      .then((loans) => live && setState({ status: 'ready', loans, error: null }))
      .catch((err) => live && setState({ status: 'error', loans: [], error: err }));
    return () => { live = false; };
  }, []);

  return (
    <div className="account">
      {location.state?.denied && (
        <p className="form__error" role="alert">
          That area is for {location.state.denied} accounts. You are signed in as a {user.role}.
        </p>
      )}

      <p className="eyebrow">Signed in</p>
      <h1 className="card__title">{user.name}</h1>
      <dl className="facts">
        <div className="facts__row"><dt>Email</dt><dd>{user.email}</dd></div>
        <div className="facts__row"><dt>Role</dt><dd>{user.role}</dd></div>
        <div className="facts__row"><dt>Member since</dt><dd>{user.createdAt?.slice(0, 10)}</dd></div>
      </dl>

      <h2 className="account__sub">Out with you right now</h2>

      {state.status === 'loading' && (
        <div className="rows" aria-hidden="true">
          {[0, 1].map((i) => (
            <div className="tag" key={i}>
              <div className="skeleton" style={{ height: '.7rem', width: '45%' }} />
              <div className="skeleton" style={{ height: '1.4rem', width: '70%', marginTop: '.7rem' }} />
            </div>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className="state state--error" role="alert">
          <p className="state__title">Could not load your loans</p>
          <p className="state__body">{state.error.message}</p>
        </div>
      )}

      {state.status === 'ready' && state.loans.length === 0 && (
        <div className="state">
          <p className="state__title">Nothing out at the moment</p>
          <p className="state__body">
            When you borrow something it appears here with its return date.
            Come by on Tuesday, Thursday or Saturday.
          </p>
        </div>
      )}

      {state.status === 'ready' && state.loans.length > 0 && (
        <div className="rows">
          {state.loans.map((l) => (
            <article className="tag" key={l.id}>
              <p className="tag__id"><span>{l.assetTag}</span><span>Due {l.dueOn}</span></p>
              <h3 className="tag__name">{l.tool}</h3>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
