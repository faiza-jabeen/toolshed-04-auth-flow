/** Client-side rules, deliberately identical to server/src/lib/validate.js. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function checkName(v = '') {
  const s = v.trim();
  if (!s) return 'Tell us what to call you.';
  if (s.length < 2) return 'That is a little short for a name.';
  if (s.length > 60) return 'Keep it under 60 characters.';
  return '';
}

export function checkEmail(v = '') {
  const s = v.trim();
  if (!s) return 'Email address is required.';
  if (!EMAIL.test(s)) return 'That does not look like an email address.';
  return '';
}

export function checkPassword(v = '') {
  if (!v) return 'Password is required.';
  if (v.length < 10) return 'Use at least 10 characters — length matters more than symbols.';
  if (!/[a-z]/i.test(v)) return 'Include at least one letter.';
  if (!/\d/.test(v)) return 'Include at least one number.';
  return '';
}

export function checkConfirm(v = '', password = '') {
  if (!v) return 'Type the password again.';
  if (v !== password) return 'The two passwords do not match.';
  return '';
}

/** Feedback, not a gate. Anything past the minimum is allowed. */
export function strength(password = '') {
  let score = 0;
  if (password.length >= 10) score += 1;
  if (password.length >= 16) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (/\d/.test(password) && /[a-z]/i.test(password)) score += 1;
  return ['Too short', 'Workable', 'Good', 'Strong', 'Very strong'][Math.min(score, 4)];
}
