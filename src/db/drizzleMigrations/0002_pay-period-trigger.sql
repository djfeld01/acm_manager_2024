-- Custom SQL migration file, put you code below! --
-- Custom SQL migration file, put you code below! --
CREATE OR REPLACE FUNCTION set_pay_period_dates()
RETURNS TRIGGER AS $$
BEGIN
  NEW.end_date := NEW.start_date + INTERVAL '13 days';
  NEW.processing_date:= NEW.start_date + INTERVAL '14 days';
  NEW.paycheck_date := NEW.start_date + INTERVAL '19 days'; -- 13 days + 6 days
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_pay_period
BEFORE INSERT ON pay_period
FOR EACH ROW
EXECUTE FUNCTION set_pay_period_dates();