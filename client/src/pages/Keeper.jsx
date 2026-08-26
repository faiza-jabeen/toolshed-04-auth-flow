import { useEffect, useState } from 'react';
import { allLoans } from '../auth/api.js';

/** Behind ProtectedRoute role="keeper" — and the API checks the role again. */
export default function Keeper() {
  const [state, setState] = useState({ status: 'loading', data: [], error: null });

  useEffect(() => {
    let live = true;
    allLoans()
      .then((data) => live && setState({ status: 'ready', data, error: null }))
      .catch((error) => live && setState({ status: 'error', data: [], error }));
    return () => { live = false; };
  }, []);

  return (
    <main className="u-shell page">
      <p className="eyebrow">Keeper only</p>
      <h1 className="page__title">Everything out of the shed.</h1>
      <p className="page__body u-measure">
        Two gates protect this: the route guard on the client, and
        <code> requireRole('keeper') </code> on the API. The client guard is a
        convenience — the server one is the security.
      </p>

      {state.status === 'loading' && <p className="page__count"><span className="spinner" /> Loading…</p>}
      {state.status === 'error' && (
        <div className="state state--error" role="alert">
          <p className="state__title">Could not load loans</p>
          <p className="state__body">{state.error.message}</p>
        </div>
      )}
      {state.status === 'ready' && state.data.length === 0 && (
        <div className="state">
          <p className="state__title">Nothing is out</p>
          <p className="state__body">Every tool is back on its shelf. Rare, and worth enjoying.</p>
        </div>
      )}
      {state.status === 'ready' && state.data.length > 0 && (
        <div className="rows">
          {state.data.map((l) => (
            <article className="tag" key={l.id}>
              <p className="tag__id"><span>{l.assetTag}</span><span>Due {l.dueOn}</span></p>
              <h3 className="tag__name">{l.tool}</h3>
              <p className="tag__meta">With {l.borrower}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
