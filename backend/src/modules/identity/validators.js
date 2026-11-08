export function isUniversityEmail(email, domain) {
  if (typeof email !== 'string' || !domain) return false;
  const e = email.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+$/.test(e) && e.endsWith('@' + domain.toLowerCase());
}
