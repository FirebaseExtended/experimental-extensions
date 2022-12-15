Use this extension to get BigQuery Remote Functions that int.

This extension:
- Creates a BigQuery Remote Function that you can use to get Geocode information from addresses in BigQuery.
     ```sql
      WITH result AS (
          SELECT 
              origin AS address,
              `extensions-sample.bq_dlp_testing`.latLong(origin) AS location 
          FROM `extensions-sample.bq_dlp_testing.addresses`
      )
      SELECT 
          address, 
          json_extract_scalar(location, '$.lat') AS lat, 
          json_extract_scalar(location, '$.lng') AS lng
      FROM result 
     ```
- Creates a BigQuery Remote Function that you can use to get driving distance and duration between two addresses.
     ```sql
      WITH result AS (
          SELECT 
              origin,
              distination,
              `extensions-sample.bq_dlp_testing`.drivingTime(origin, distination) AS driveTime 
          FROM `extensions-sample.bq_dlp_testing.addresses`
      )
      SELECT 
          origin, 
          distination, 
          driveTime
      FROM result 
     ```