ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS nowpayments_invoice_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS nowpayments_payment_id text;