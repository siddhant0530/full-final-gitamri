-- Invoice system migration
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- Adds two nullable columns to the existing "Order" table (safe for
-- existing rows — they'll just have NULL until an invoice is generated
-- for them), plus a sequence + function pair that atomically hands out
-- the next invoice number so two admins downloading invoices at the
-- same moment can never collide on the same number.

alter table "Order" add column if not exists "invoiceNumber" text unique;
alter table "Order" add column if not exists "invoiceGeneratedAt" timestamptz;

create sequence if not exists invoice_number_seq start 1;

create or replace function next_invoice_number()
returns bigint
language sql
as $$
  select nextval('invoice_number_seq');
$$;

-- Forces PostgREST to pick up the new column/function immediately
-- instead of waiting for its next automatic schema-cache refresh.
notify pgrst, 'reload schema';
