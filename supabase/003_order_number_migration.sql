-- Sequential order number migration
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- Adds a nullable "orderNumber" column to the existing "Order" table
-- (safe for existing rows — they'll just have NULL, and the invoice
-- falls back to the tracking ID for those older orders), plus a
-- sequence + function pair that atomically hands out the next order
-- number the moment an order is placed, so two customers checking out
-- at the same instant can never collide on the same number.
--
-- This is deliberately a separate counter from invoice_number_seq:
-- the order number is assigned at checkout (order placed), while the
-- invoice number is only assigned the first time someone downloads
-- that order's invoice PDF — the two can legitimately drift apart.

alter table "Order" add column if not exists "orderNumber" bigint unique;

create sequence if not exists order_number_seq start 1;

create or replace function next_order_number()
returns bigint
language sql
as $$
  select nextval('order_number_seq');
$$;

-- Forces PostgREST to pick up the new column/function immediately
-- instead of waiting for its next automatic schema-cache refresh.
notify pgrst, 'reload schema';
