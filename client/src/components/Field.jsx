export function Field({ label, error, hint, children }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {error ? <span className="field__error" role="alert">{error}</span>
             : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}
