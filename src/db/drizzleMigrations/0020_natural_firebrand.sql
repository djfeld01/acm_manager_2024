DO $$ BEGIN
 CREATE TYPE "public"."holiday_type" AS ENUM('christmas', 'thanksgiving', 'newYear', 'memorialDay', 'laborDay', 'fourthOfJuly');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
