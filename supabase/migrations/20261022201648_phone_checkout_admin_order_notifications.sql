-- Keep historical order emails, but new checkout collects only a contact number.
ALTER TABLE public.orders ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.store_settings
  ADD COLUMN admin_order_emails_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.store_settings.admin_order_emails_enabled IS
  'Send a new-order email to configured admins. Customer and order-status emails are disabled.';

-- Reuse the established atomic checkout and payment-proof locking path.
-- This phone-only entry point does not accept or infer an email address.
CREATE FUNCTION public.commit_checkout_order_v4(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_city TEXT,
  p_postal_code TEXT,
  p_country TEXT,
  p_delivery_type public.delivery_type,
  p_notes TEXT,
  p_subtotal NUMERIC,
  p_shipping NUMERIC,
  p_total NUMERIC,
  p_items JSONB,
  p_payment_intent_id UUID,
  p_payment_claim_hash TEXT,
  p_success_token_hash TEXT
) RETURNS TABLE (
  id UUID,
  order_number TEXT,
  subtotal NUMERIC,
  shipping NUMERIC,
  tax NUMERIC,
  total NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_phone IS NULL OR length(trim(p_phone)) NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'Contact number is required' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT committed.id, committed.order_number, committed.subtotal,
    committed.shipping, committed.tax, committed.total
  FROM public.commit_checkout_order_v3(
    p_user_id, NULL::TEXT, p_full_name, p_phone, p_address, p_city,
    p_postal_code, p_country, p_delivery_type, p_notes, p_subtotal,
    p_shipping, p_total, p_items, p_payment_intent_id,
    p_payment_claim_hash, p_success_token_hash
  ) AS committed;
END;
$$;

REVOKE ALL ON FUNCTION public.commit_checkout_order_v4(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.delivery_type,
  TEXT, NUMERIC, NUMERIC, NUMERIC, JSONB, UUID, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_checkout_order_v4(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.delivery_type,
  TEXT, NUMERIC, NUMERIC, NUMERIC, JSONB, UUID, TEXT, TEXT
) TO service_role;
