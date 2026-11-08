export function isUniversityEmail(email, domain) {
  if (typeof email !== 'string' || !domain) return false;
  const e = email.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+$/.test(e) && e.endsWith('@' + domain.toLowerCase());
}


export function isVerifiedUniversityUser(user, domain) {
  if (!user || !isUniversityEmail(user.email, domain)) {
    return false;
  }

  return Boolean(user.email_confirmed_at);
}
