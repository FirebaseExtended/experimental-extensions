### See it in action

This extension allows you to fetch latitude and longitude for an address and calculate driving time between two addresses using Google Maps APIs within your BigQuery queries by leveraging BigQuery Remote Functions.

Two new BigQuery Remote Functions have been created:

### latLong(address: STRING): 
Given an address, returns the latitude and longitude as a JSON string.

### drivingTime(origin: STRING, destination: STRING): 
Given an origin and destination address, returns the driving time in seconds as a JSON string.


### Example Usage
Run the following examples in BigQuery:

#### Get Geocode information from addresses in BigQuery.
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

#### Get driving distance and duration between two addresses.
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

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.