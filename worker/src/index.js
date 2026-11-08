import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)');

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const interval = Number(process.env.POLL_INTERVAL_MS) || 10000;
const transport = SMTP_HOST
  ? nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT) || 587, auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined })
  : null;

async function send(to, subject, text) {
  if (!transport) { console.log(`[dev e-mail] to=${to} subject="${subject}"\n${text}`); return; }
  await transport.sendMail({ from: MAIL_FROM, to, subject, text });
}

async function processBatch() {
  const { data: pending, error } = await db.from('notifications')
    .select('id, user_id, subject, body').eq('status', 'pending').order('created_at').limit(20);
  if (error) { console.error('Cannot read queue:', error.message); return; }
  for (const n of pending) {
    try {
      const { data, error: userErr } = await db.auth.admin.getUserById(n.user_id);
      if (userErr || !data?.user?.email) throw userErr || new Error('user has no e-mail');
      await send(data.user.email, n.subject, n.body);
      await db.from('notifications').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', n.id);
    } catch (e) {
      console.error(`Notification ${n.id} failed:`, e.message);
      await db.from('notifications').update({ status: 'failed' }).eq('id', n.id);
    }
  }
}

// Run ONE worker instance (no row locking yet): simple sequential loop, no overlapping runs.
console.log('Notification Worker started');
while (true) {
  await processBatch();
  await new Promise((r) => setTimeout(r, interval));
}
