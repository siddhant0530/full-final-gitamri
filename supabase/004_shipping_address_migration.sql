-- Ship-to / bill-to address migration
-- Run this once in the Supabase SQL Editor.
--
-- Adds a nullable "shippingAddress" jsonb column to "Order". NULL (the
-- default, and every existing order) means "ship-to is the same as
-- bill-to" — the normal case. It's only populated when a customer
-- explicitly used the "Ship to a different address?" toggle at
-- checkout, storing { name, phone, address, city, pincode, state }.
--
-- lib/invoice.ts compares this against the billing address (customer)
-- automatically: same (or absent) -> one merged Consignee & Buyer box;
-- different -> two separate boxes, same as the original Tally layout.
-- It also uses the ship-to state (not billing state) to determine
-- place of supply / CGST+SGST vs IGST, since that's what GST law
-- actually keys off for goods.

alter table "Order" add column if not exists "shippingAddress" jsonb;

notify pgrst, 'reload schema';
