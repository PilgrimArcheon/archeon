/** npm run check:invoice-auth — validates Neon setup without printing secrets. */
import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
import { neon } from '@neondatabase/serverless';
loadEnvConfig(process.cwd(), true);
const missing = [];
if (!process.env.ARCHEON_DATABASE_URL && !process.env.INVOICE_DATABASE_URL) missing.push('ARCHEON_DATABASE_URL');
if (!process.env.ARCHEON_AUTH_RATE_SECRET || process.env.ARCHEON_AUTH_RATE_SECRET.length < 32)
  missing.push('ARCHEON_AUTH_RATE_SECRET (32+ characters)');
if (missing.length) {
  console.error('Account setup needs:', missing.join(', '));
  process.exit(1);
}
const sql = neon(process.env.ARCHEON_DATABASE_URL || process.env.INVOICE_DATABASE_URL);
const required = [
  'archeon_users', 'archeon_password_credentials', 'archeon_workspaces',
  'archeon_workspace_members', 'archeon_sessions', 'archeon_auth_rate_limits',
  'invoice_workspace_settings', 'invoice_workspace_clients',
  'invoice_workspace_records', 'invoice_workspace_counters',
];
try {
  const rows = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
  const present = new Set(rows.map(r => r.table_name));
  const missingTables = required.filter(t => !present.has(t));
  if (missingTables.length) {
    console.error('Neon connected, but tables are missing:', missingTables.join(', '));
    console.error('Run scripts/public-apps-schema.sql (new) or scripts/password-auth-migration.sql (existing database).');
    process.exit(1);
  }
  console.log('✓ Neon connected and all required account/invoice tables exist.');
  console.log('✓ Email/password login requires no sender domain or email API provider.');
  console.log('Next: npm run dev — then visit http://localhost:3000/app/invoice');
} catch (err) {
  console.error('Neon connection failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}
