-- Sandiwa OS — demo seed (run third)
-- Demo login password for all accounts: demo1234

TRUNCATE TABLE
  broadcast_deliveries, broadcasts, poll_votes, polls,
  ledger_entries, disbursement_vouchers, ledger_accounts,
  clearance_requests, payments, invoices, assessment_types,
  units, intake_cases, announcements, sessions, officers,
  org_users, platform_admins, organizations
CASCADE;

INSERT INTO organizations (id, slug, name, address, contact_email, contact_phone, plan_tier, status, terminology_override_slug, features, landing, logo_url, hero_image_url) VALUES
  ('org-greenfield-hoa', 'greenfield-hoa', 'Greenfield Village HOA', 'Greenfield Ave, Sta. Rosa, Laguna', 'info@greenfield-hoa.local', '+63 49 123 4567', 'premium', 'active', 'greenfield-hoa', '{"intake":true,"payments":true,"ledger":false,"polls":true,"broadcasts":true,"landing_editor":true,"staff_management":true,"announcements":true}'::jsonb, '{"heroTitle":"Welcome to Greenfield Village","heroSubtitle":"Your homeowners association digital hub","welcomeMessage":"Pay dues, file requests, and stay updated on community news in one place.","contactAddress":"Greenfield Clubhouse, Greenfield Ave, Sta. Rosa, Laguna","contactPhone":"+63 49 123 4567","contactEmail":"info@greenfield-hoa.local","officeHours":"Mon-Fri 9:00 AM - 5:00 PM","accentColor":"#1f6b3a","brandId":"greenfield"}'::jsonb, '/assets/orgs/greenfield-logo.png', '/assets/orgs/greenfield-hero.png'),
  ('org-sunrise-condo', 'sunrise-condo', 'Sunrise Condominium HOA', 'Sunrise Blvd, Makati City', 'admin@sunrise-condo.local', '+63 2 876 5432', 'standard', 'active', NULL, '{"intake":true,"payments":true,"ledger":true,"polls":true,"broadcasts":false,"landing_editor":true,"staff_management":true,"announcements":true}'::jsonb, '{"heroTitle":"Sunrise Condominium","heroSubtitle":"Tower living, simplified","welcomeMessage":"Manage your unit fees and community updates from your phone.","contactAddress":"Tower A Lobby, Sunrise Blvd, Makati City","contactPhone":"+63 2 876 5432","contactEmail":"admin@sunrise-condo.local","officeHours":"Daily 8:00 AM - 6:00 PM","accentColor":"#8b5429","brandId":"sunrise"}'::jsonb, '/assets/orgs/sunrise-logo.png', '/assets/orgs/sunrise-hero.png');

INSERT INTO platform_admins (id, email, password_hash, name, status) VALUES
  ('plat-1', 'admin@sandiwa.local', 'a5aa80a6b42d8cb366defb51e83e7635:91fcca2c4670ef202a605ffe8e7cfb988db3f49f350a1d64c48d076a0d087d5f2e5f15062b15e561b685b4c3d90afc87c5d37009e1d448487dfe9890d72a597a', 'Platform Administrator', 'active');

INSERT INTO org_users (id, organization_id, email, password_hash, name, role, unit_label, member_no, status) VALUES
  ('user-gf-admin', 'org-greenfield-hoa', 'admin@greenfield-hoa.local', 'a5aa80a6b42d8cb366defb51e83e7635:91fcca2c4670ef202a605ffe8e7cfb988db3f49f350a1d64c48d076a0d087d5f2e5f15062b15e561b685b4c3d90afc87c5d37009e1d448487dfe9890d72a597a', 'Elena Garcia', 'org_admin', NULL, NULL, 'active'),
  ('user-gf-member', 'org-greenfield-hoa', 'member@greenfield-hoa.local', 'a5aa80a6b42d8cb366defb51e83e7635:91fcca2c4670ef202a605ffe8e7cfb988db3f49f350a1d64c48d076a0d087d5f2e5f15062b15e561b685b4c3d90afc87c5d37009e1d448487dfe9890d72a597a', 'Pedro Ramos', 'member', 'Block 3 Lot 12', 'GF-0312', 'active'),
  ('user-sc-admin', 'org-sunrise-condo', 'admin@sunrise-condo.local', 'a5aa80a6b42d8cb366defb51e83e7635:91fcca2c4670ef202a605ffe8e7cfb988db3f49f350a1d64c48d076a0d087d5f2e5f15062b15e561b685b4c3d90afc87c5d37009e1d448487dfe9890d72a597a', 'Grace Tan', 'org_admin', NULL, NULL, 'active');

INSERT INTO units (id, organization_id, code, phase, block, lot, tower, floor, unit_type, occupancy, owner_user_id, area_sqm, status) VALUES
  ('unit-gf-0312', 'org-greenfield-hoa', 'B3-L12', 'Phase 1', '3', '12', NULL, NULL, 'house', 'owner_occupied', 'user-gf-member', 120.00, 'active'),
  ('unit-sc-a12b', 'org-sunrise-condo', 'A-12B', NULL, NULL, NULL, 'A', '12', 'condo', 'owner_occupied', 'user-sc-member', 48.00, 'active');

INSERT INTO announcements (id, organization_id, title, body, published_at, author_id) VALUES
  ('ann-1', 'org-greenfield-hoa', 'Annual General Meeting — March 15', 'All homeowners are invited to the AGM at the clubhouse on March 15, 2:00 PM.', '2026-03-01T08:00:00Z', 'user-gf-admin');
