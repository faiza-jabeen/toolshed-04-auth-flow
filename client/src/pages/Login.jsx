import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import { Field } from '../components/Field.jsx';
import { checkEmail } from '../auth/rules.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Where they were trying to go before the guard bounced them.
  const destination = location.state?.from?.pathname || '/dashboard';

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const found = {
      email: checkEmail(values.email),
      password: values.password ? '' : 'Password is required.',
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setBusy(true);
    setFormError('');
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate(destination, { replace: true });
    } catch (err) {
      if (err.fields) setErrors((prev) => ({ ...prev, ...err.fields }));
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="u-shell gate">
      <form className="panel gate__card" onSubmit={submit} noValidate>
        <p className="eyebrow">Members</p>
        <h1 className="gate__title">Sign in.</h1>
        {location.state?.from && (
          <p className="gate__body">Sign in to reach {location.state.from.pathname}.</p>
        )}

        {formError && <p className="gate__alert" role="alert">{formError}</p>}

        <Field label="Email address" error={errors.email}>
          <input className="input" type="email" value={values.email} onChange={set('email')}
                 aria-invalid={!!errors.email} autoComplete="email" disabled={busy} />
        </Field>

        <Field label="Password" error={errors.password}>
          <input className="input" type="password" value={values.password} onChange={set('password')}
                 aria-invalid={!!errors.password} autoComplete="current-password" disabled={busy} />
        </Field>

        <button className="btn btn--tape gate__submit" type="submit" disabled={busy}>
          {busy && <span className="spinner" />}{busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="gate__foot">No account yet? <Link to="/signup">Join the shed</Link>.</p>
      </form>
    </main>
  );
}
