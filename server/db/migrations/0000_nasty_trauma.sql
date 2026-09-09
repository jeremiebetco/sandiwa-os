CREATE TYPE "public"."account_type" AS ENUM('asset', 'liability', 'equity', 'income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."broadcast_channel" AS ENUM('portal', 'sms', 'both');--> statement-breakpoint
CREATE TYPE "public"."broadcast_severity" AS ENUM('info', 'warning', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."clearance_status" AS ENUM('pending', 'approved', 'rejected', 'issued');--> statement-breakpoint
CREATE TYPE "public"."clearance_type" AS ENUM('hoa_clearance', 'move_in', 'move_out', 'resale', 'certificate');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('queued', 'sent', 'failed', 'read');--> statement-breakpoint
CREATE TYPE "public"."intake_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'open', 'partial', 'paid', 'void', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."occupancy_status" AS ENUM('owner_occupied', 'tenant', 'vacant');--> statement-breakpoint
CREATE TYPE "public"."org_role" AS ENUM('org_admin', 'manager', 'committee_lead', 'staff', 'member');--> statement-breakpoint
CREATE TYPE "public"."org_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('gcash', 'maya', 'bank_transfer', 'cash', 'check', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('basic', 'standard', 'premium');--> statement-breakpoint
CREATE TYPE "public"."poll_eligibility" AS ENUM('per_unit', 'per_member');--> statement-breakpoint
CREATE TYPE "public"."poll_status" AS ENUM('draft', 'open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('neutral', 'concerned', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."session_context" AS ENUM('platform', 'organization');--> statement-breakpoint
CREATE TYPE "public"."unit_type" AS ENUM('house', 'townhouse', 'condo', 'parking', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."voucher_status" AS ENUM('draft', 'pending_approval', 'approved', 'paid', 'rejected');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"author_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_types" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"frequency" varchar(32) DEFAULT 'monthly' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"broadcast_id" text NOT NULL,
	"recipient_id" text,
	"channel" "broadcast_channel" DEFAULT 'portal' NOT NULL,
	"status" "delivery_status" DEFAULT 'queued' NOT NULL,
	"error" text,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"severity" "broadcast_severity" DEFAULT 'info' NOT NULL,
	"channel" "broadcast_channel" DEFAULT 'portal' NOT NULL,
	"audience_phase" varchar(64),
	"audience_unit_type" varchar(64),
	"created_by_id" text NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clearance_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"unit_id" text NOT NULL,
	"requester_id" text NOT NULL,
	"requester_name" text NOT NULL,
	"type" "clearance_type" DEFAULT 'hoa_clearance' NOT NULL,
	"purpose" text,
	"status" "clearance_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" text,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disbursement_vouchers" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"account_id" text NOT NULL,
	"payee" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" "voucher_status" DEFAULT 'draft' NOT NULL,
	"requested_by_id" text NOT NULL,
	"approved_by_id" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" text NOT NULL,
	"member_name" text NOT NULL,
	"unit" text,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"sentiment" "sentiment" DEFAULT 'neutral' NOT NULL,
	"status" "intake_status" DEFAULT 'open' NOT NULL,
	"assigned_to_id" text,
	"assigned_to_name" text,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"unit_id" text NOT NULL,
	"assessment_type_id" text,
	"period" varchar(16) NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"penalty_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" "invoice_status" DEFAULT 'open' NOT NULL,
	"due_date" date NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" text NOT NULL,
	"account_type" "account_type" NOT NULL,
	"fund_category" varchar(64),
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"account_id" text NOT NULL,
	"entry_date" date NOT NULL,
	"description" text NOT NULL,
	"debit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"reference_type" varchar(32),
	"reference_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "officers" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"position" text NOT NULL,
	"contact" text,
	"photo_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_users" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "org_role" NOT NULL,
	"unit_label" text,
	"member_no" varchar(64),
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"contact_email" text DEFAULT '' NOT NULL,
	"contact_phone" text DEFAULT '' NOT NULL,
	"plan_tier" "plan_tier" DEFAULT 'basic' NOT NULL,
	"status" "org_status" DEFAULT 'active' NOT NULL,
	"terminology_override_slug" varchar(64),
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"landing" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"logo_url" text,
	"hero_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"unit_id" text NOT NULL,
	"invoice_id" text,
	"amount" numeric(12, 2) NOT NULL,
	"method" "payment_method" DEFAULT 'gcash' NOT NULL,
	"reference" text,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"submitted_by_id" text,
	"verified_by_id" text,
	"notes" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "platform_admins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"poll_id" text NOT NULL,
	"unit_id" text,
	"voter_id" text NOT NULL,
	"option_index" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "poll_status" DEFAULT 'draft' NOT NULL,
	"eligibility" "poll_eligibility" DEFAULT 'per_unit' NOT NULL,
	"quorum_percent" integer DEFAULT 50 NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"created_by_id" text NOT NULL,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" text NOT NULL,
	"context" "session_context" NOT NULL,
	"organization_id" text,
	"organization_slug" varchar(64),
	"role" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"code" varchar(64) NOT NULL,
	"phase" varchar(64),
	"block" varchar(64),
	"lot" varchar(64),
	"tower" varchar(64),
	"floor" varchar(32),
	"unit_type" "unit_type" DEFAULT 'house' NOT NULL,
	"occupancy" "occupancy_status" DEFAULT 'owner_occupied' NOT NULL,
	"owner_user_id" text,
	"area_sqm" numeric(10, 2),
	"status" "user_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_types" ADD CONSTRAINT "assessment_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_deliveries" ADD CONSTRAINT "broadcast_deliveries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_deliveries" ADD CONSTRAINT "broadcast_deliveries_broadcast_id_broadcasts_id_fk" FOREIGN KEY ("broadcast_id") REFERENCES "public"."broadcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearance_requests" ADD CONSTRAINT "clearance_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearance_requests" ADD CONSTRAINT "clearance_requests_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursement_vouchers" ADD CONSTRAINT "disbursement_vouchers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursement_vouchers" ADD CONSTRAINT "disbursement_vouchers_account_id_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."ledger_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_cases" ADD CONSTRAINT "intake_cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_assessment_type_id_assessment_types_id_fk" FOREIGN KEY ("assessment_type_id") REFERENCES "public"."assessment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."ledger_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "officers" ADD CONSTRAINT "officers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_users" ADD CONSTRAINT "org_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_accounts_org_code_idx" ON "ledger_accounts" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "org_users_org_email_idx" ON "org_users" USING btree ("organization_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "poll_votes_poll_unit_idx" ON "poll_votes" USING btree ("poll_id","unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "poll_votes_poll_voter_idx" ON "poll_votes" USING btree ("poll_id","voter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "units_org_code_idx" ON "units" USING btree ("organization_id","code");