// ============================================================================
// generate-accounts.mjs
// Generates strong demo-account passwords ONCE and writes them to
//   scripts/accounts.json     (machine-readable, gitignored)
//   CREDENTIALS.txt           (human-readable, gitignored)
// scripts/seed-users.mjs reads accounts.json, so the documented passwords are
// exactly the ones provisioned into Supabase Auth (bcrypt-hashed server-side).
//
//   Run: node scripts/generate-accounts.mjs   (idempotent; keeps existing pw)
// ============================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');
const CREDS_FILE = path.join(ROOT, 'CREDENTIALS.txt');

const strong = (len = 16) =>
  randomBytes(len).toString('base64url').replace(/[-_]/g, 'A').slice(0, len) + '!7a';

const accounts = [
  { key: 'admin',    displayName: 'Admin',      role: 'admin',      email: 'admin@pilates-studio.app',        loginId: 'admin' },
  { key: 'neelamr',  displayName: 'Neelam R',   role: 'instructor', email: 'neelamr@zenpilates.com',           loginId: 'neelamr' },
  { key: 's1',       displayName: 'Neha Sharma',   role: 'student', email: 'neha@email.com',                  loginId: 's1' },
  { key: 's2',       displayName: 'Kavita Singh',  role: 'student', email: 'kavita@email.com',                loginId: 's2' },
  { key: 's3',       displayName: 'Meera Iyer',    role: 'student', email: 'meera@email.com',                 loginId: 's3' },
  { key: 's4',       displayName: 'Rohit Joshi',   role: 'student', email: 'rohit@email.com',                 loginId: 's4' },
  { key: 's5',       displayName: 'Ananya K.',     role: 'student', email: 'ananya@email.com',                loginId: 's5' },
  { key: 's6',       displayName: 'Priya Mehta',   role: 'student', email: 'priyam@email.com',                loginId: 's6' },
  { key: 's7',       displayName: 'Amit Patel',    role: 'student', email: 'amitp@email.com',                 loginId: 's7' },
  { key: 's8',       displayName: 'Sneha Reddy',   role: 'student', email: 'sneha@email.com',                 loginId: 's8' },
  { key: 's9',       displayName: 'Neelam Varma',  role: 'student', email: 'neelam@email.com',                loginId: 's9' },
];

let existing = {};
if (existsSync(ACCOUNTS_FILE)) {
  try { existing = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8')); } catch {}
}

for (const a of accounts) {
  if (!existing[a.key] || !existing[a.key].password) {
    existing[a.key] = { ...a, password: strong() };
  } else {
    existing[a.key] = { ...existing[a.key], ...a };
  }
}

const finalAccounts = accounts.map(a => existing[a.key]);
writeFileSync(ACCOUNTS_FILE, JSON.stringify(finalAccounts, null, 2) + '\n');

const pad = (s, n) => String(s).padEnd(n);
const lines = [
  '===========================================================================',
  ' PILATES STUDIO APP — DEMO ACCOUNT CREDENTIALS (generated ' + new Date().toISOString() + ')',
  ' Store securely. Passwords are bcrypt-hashed in Supabase Auth (server-side);',
  ' plaintext exists only in this file and scripts/accounts.json.',
  '===========================================================================',
  '',
];
for (const a of finalAccounts) {
  lines.push(`${pad(a.role.toUpperCase(), 11)} | ${pad(a.displayName, 16)} | ${pad(a.email, 32)} | ${a.password}`);
}
lines.push('');

writeFileSync(CREDS_FILE, lines.join('\n'));
console.log('Wrote ' + ACCOUNTS_FILE);
console.log('Wrote ' + CREDS_FILE);
console.log('');
for (const a of finalAccounts) {
  console.log(`${a.role.padEnd(10)} | ${a.key.padEnd(8)} | ${a.email.padEnd(32)} | ${a.password}`);
}
