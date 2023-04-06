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
              distenation,
              `extensions-sample.bq_dlp_testing`.drivingTime(origin, distenation) AS driveTime 
          FROM `extensions-sample.bq_dlp_testing.addresses`
      )
      SELECT 
          origin, 
          distenation, 
          driveTime
      FROM result 
     ```

## Pre-requisites

1. A BigQuery dataset to use with the extension. You can create a new dataset or use an existing one. You will need to provide the dataset ID when you install the extension.
2. Enable the Google Maps API for your project and get an API key. You can find instructions on how to do this [here](https://developers.google.com/maps/get-started#api-key).
