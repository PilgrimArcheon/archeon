-- OPTIONAL ONE-TIME OWNER DATA IMPORT. Back up the database first!
-- 1) Deploy public-apps-schema.sql.
-- 2) Sign in through /app/invoice using YOUR email to create your workspace.
-- 3) Replace the email below with YOUR VERIFIED ARCHEON ACCOUNT email.
-- 4) Confirm row counts and run this file in Neon's SQL editor.
--
-- Other users cannot access legacy tables; this script deliberately imports
-- old single-owner data into one explicitly selected verified account only.
DO $migration$
DECLARE
  owner_email TEXT := 'REPLACE-WITH-YOUR-EMAIL@example.com';
  target_workspace UUID;
BEGIN
  IF owner_email LIKE 'REPLACE-WITH-%' THEN
    RAISE EXCEPTION 'Edit owner_email before migrating.';
  END IF;
  SELECT w.id INTO target_workspace
    FROM archeon_workspaces w JOIN archeon_users u ON u.id=w.owner_user_id
    WHERE u.email=LOWER(owner_email);
  IF target_workspace IS NULL THEN
    RAISE EXCEPTION 'Sign in as % before running this migration.', owner_email;
  END IF;
  INSERT INTO invoice_workspace_settings(workspace_id,data,updated_at)
    SELECT target_workspace,s.data,s.updated_at FROM invoice_settings s WHERE s.id=1
    ON CONFLICT(workspace_id) DO NOTHING;
  INSERT INTO invoice_workspace_clients(id,workspace_id,data,created_at,updated_at)
    SELECT c.id::uuid,target_workspace,c.data,c.created_at,c.updated_at FROM invoice_clients c
    ON CONFLICT(id) DO NOTHING;
  INSERT INTO invoice_workspace_records(id,workspace_id,invoice_no,data,created_at,updated_at,sent_at)
    SELECT r.id::uuid,target_workspace,r.invoice_no,r.data,r.created_at,r.updated_at,r.sent_at
    FROM invoice_records r ON CONFLICT(id) DO NOTHING;
  INSERT INTO invoice_workspace_counters(workspace_id,next_no)
    SELECT target_workspace,COALESCE(MAX(next_no),0) FROM invoice_counters
    ON CONFLICT(workspace_id) DO UPDATE SET next_no=GREATEST(invoice_workspace_counters.next_no,EXCLUDED.next_no);
  INSERT INTO invoice_workspace_email_log(workspace_id,invoice_id,recipient,delivery_status,detail,send_window,created_at)
    SELECT target_workspace,l.invoice_id::uuid,l.recipient,
       CASE WHEN l.delivery_status='accepted' THEN 'accepted' ELSE 'failed' END,
       l.detail,DATE_TRUNC('minute',l.created_at),l.created_at
    FROM invoice_email_log l
    INNER JOIN invoice_workspace_records r ON r.id=l.invoice_id::uuid AND r.workspace_id=target_workspace
    ON CONFLICT DO NOTHING;
  RAISE NOTICE 'Legacy invoices imported to workspace %', target_workspace;
END
$migration$;
