-- Row Level Security for Sandiwa OS tenant tables
-- Policies key off app.current_org_id (SET LOCAL in withOrgContext)
-- Platform admin sets app.is_platform_admin = 'true'

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'officers',
    'org_users',
    'announcements',
    'intake_cases',
    'units',
    'assessment_types',
    'invoices',
    'payments',
    'clearance_requests',
    'ledger_accounts',
    'disbursement_vouchers',
    'ledger_entries',
    'polls',
    'poll_votes',
    'broadcasts',
    'broadcast_deliveries'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
      USING (
        current_setting('app.is_platform_admin', true) = 'true'
        OR organization_id = NULLIF(current_setting('app.current_org_id', true), '')
      )
      WITH CHECK (
        current_setting('app.is_platform_admin', true) = 'true'
        OR organization_id = NULLIF(current_setting('app.current_org_id', true), '')
      )
    $f$, t);
  END LOOP;
END $$;

-- Organizations: platform admin sees all; org context sees own; public_read for active tenant resolution
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_access ON organizations;
CREATE POLICY org_access ON organizations
  USING (
    current_setting('app.is_platform_admin', true) = 'true'
    OR id = NULLIF(current_setting('app.current_org_id', true), '')
    OR (
      current_setting('app.public_read', true) = 'true'
      AND status = 'active'
    )
  )
  WITH CHECK (
    current_setting('app.is_platform_admin', true) = 'true'
    OR id = NULLIF(current_setting('app.current_org_id', true), '')
  );

-- Sessions and platform_admins are not RLS-scoped (app-level auth)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sessions_all ON sessions;
CREATE POLICY sessions_all ON sessions USING (true) WITH CHECK (true);

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_admins_all ON platform_admins;
CREATE POLICY platform_admins_all ON platform_admins USING (true) WITH CHECK (true);
