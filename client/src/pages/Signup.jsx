import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import { Field } from '../components/Field.jsx';
import { checkName, checkEmail, checkPassword, checkConfirm, strength } from '../auth/rules.js';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const validate = (v) => ({
    name: checkName(v.name),
    email: checkEmail(v.email),
    password: checkPassword(v.password),
    confirm: checkConfirm(v.confirm, v.password),
  });

  const set = (key) => (e) => {
    const next = { ...values, [key]: e.target.value };
    setValues(next);
    if (errors[key] !== undefined) setErrors(validate(next));
  };

  async function submit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setBusy(true);
    setFormError('');
    try {
      await signup({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // The server is the authority — its per-field messages win over ours.
      if (err.fields) setErrors((prev) => ({ ...prev, ...err.fields }));
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="u-shell gate">
      <form className="panel gate__card" onSubmit={submit} noValidate>
        <p className="eyebrow">New member</p>
        <h1 className="gate__title">Join the shed.</h1>
        <p className="gate__body">Membership is £25 a year, paid at the desk. This just creates your account.</p>

        {formError && <p className="gate__alert" role="alert">{formError}</p>}

        <Field label="Your name" error={errors.name}>
          <input className="input" value={values.name} onChange={set('name')}
                 aria-invalid={!!errors.name} autoComplete="name" disabled={busy} />
        </Field>

        <Field label="Email address" error={errors.email}>
          <input className="input" type="email" value={values.email} onChange={set('email')}
                 aria-invalid={!!errors.email} autoComplete="email" disabled={busy} />
        </Field>

        <Field label="Password" error={errors.password}
               hint={values.password ? `Strength: ${strength(values.password)}` : 'At least 10 characters, with a number.'}>
          <input className="input" type="password" value={values.password} onChange={set('password')}
                 aria-invalid={!!errors.password} autoComplete="new-password" disabled={busy} />
        </Field>

        <Field label="Password again" error={errors.confirm}>
          <input className="input" type="password" value={values.confirm} onChange={set('confirm')}
                 aria-invalid={!!errors.confirm} autoComplete="new-password" disabled={busy} />
        </Field>

        <button className="btn btn--tape gate__submit" type="submit" disabled={busy}>
          {busy && <span className="spinner" />}{busy ? 'Creating your account…' : 'Create account'}
        </button>

        <p className="gate__foot">Already a member? <Link to="/login">Sign in</Link>.</p>
      </form>
    </main>
  );
}
