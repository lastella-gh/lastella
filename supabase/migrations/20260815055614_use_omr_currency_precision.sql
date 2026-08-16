-- Omani Rial is divided into 1,000 baisa, so all stored monetary values use
-- three decimal places.
ALTER TABLE public.products
  ALTER COLUMN price TYPE NUMERIC(12,3) USING price::NUMERIC(12,3),
  ALTER COLUMN old_price TYPE NUMERIC(12,3) USING old_price::NUMERIC(12,3);

ALTER TABLE public.orders
  ALTER COLUMN subtotal TYPE NUMERIC(12,3) USING subtotal::NUMERIC(12,3),
  ALTER COLUMN shipping TYPE NUMERIC(12,3) USING shipping::NUMERIC(12,3),
  ALTER COLUMN tax TYPE NUMERIC(12,3) USING tax::NUMERIC(12,3),
  ALTER COLUMN total TYPE NUMERIC(12,3) USING total::NUMERIC(12,3),
  ALTER COLUMN country SET DEFAULT 'Oman';

ALTER TABLE public.order_items
  ALTER COLUMN unit_price TYPE NUMERIC(12,3) USING unit_price::NUMERIC(12,3);

-- Preserve the already-audited checkout body while upgrading its internal
-- money variables and rounding from two to three decimal places.
DO $$
DECLARE
  function_definition TEXT;
  updated_definition TEXT;
BEGIN
  SELECT pg_get_functiondef(
    'public.create_checkout_order(text,text,text,text,text,text,text,text,text,boolean,jsonb)'::regprocedure
  ) INTO function_definition;

  updated_definition := replace(function_definition, 'NUMERIC(12,2)', 'NUMERIC(12,3)');
  updated_definition := replace(updated_definition, 'round(v_subtotal, 2)', 'round(v_subtotal, 3)');
  updated_definition := replace(updated_definition, 'round(v_subtotal * 0.05, 2)', 'round(v_subtotal * 0.05, 3)');

  IF updated_definition = function_definition THEN
    RAISE EXCEPTION 'Checkout function OMR precision update did not match the expected definition';
  END IF;

  EXECUTE updated_definition;
END;
$$;
