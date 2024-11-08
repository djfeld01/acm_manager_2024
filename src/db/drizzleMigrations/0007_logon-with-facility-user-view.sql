-- Custom SQL migration file, put you code below! --
-- Custom SQL migration file, put you code below! ---- Custom SQL migration file, put you code below! --
CREATE MATERIALIZED VIEW "logon_with_facility_user_view" AS
SELECT 
    "sitelink_logon"."sitelink_employee_id", 
    "sitelink_logon"."date_time", 
    "sitelink_logon"."computer_name",
    "sitelink_logon"."computer_ip",
    "user_to_facilities"."storage_facility_id",
    "user_to_facilities"."user_id",
    "user_detail"."first_name",
    "user_detail"."last_name",
    "storage_facility"."facility_name",
    "storage_facility"."facility_abbreviation"
FROM 
    "sitelink_logon"
INNER JOIN 
    "user_to_facilities" 
ON 
    "sitelink_logon"."sitelink_employee_id" = "user_to_facilities"."sitelink_employee_id"
INNER JOIN
    "user_detail"
ON  
    "user_to_facilities"."user_id" = "user_detail"."id"
INNER JOIN
    "storage_facility"
ON 
    "storage_facility"."sitelink_id" = "user_to_facilities"."storage_facility_id";
-- DROP MATERIALIZED VIEW IF EXISTS "logon_with_facility_user_view";