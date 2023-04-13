### See it in action

1. Go to your project's [BigQuery](https://console.cloud.google.com/bigquery?cloudshell=false&project=${param:PROJECT_ID}) in the Google Cloud console.
2. If it doesn't exist already, create a dataset called `${param:DATASET_ID}`.
3. Create a table that contains the data you want to de-identify.
4. Run the following query to de-identify the data in the table:

```sql
SELECT
    val,
    `dev-extensions-testing.bq_testing`.deindetify(TO_JSON(val))
FROM
    `dev-extensions-testing.bq_testing.users` AS val 
```

5. Run the following query to re-identify the data in the table:

```sql
SELECT
    val,
    `dev-extensions-testing.bq_testing`.reindetify(TO_JSON(val))
FROM
    `dev-extensions-testing.bq_testing.users` AS val 
```

### Monitoring

As a best practice, you can [monitor the activity](https://firebase.google.com/docs/extensions/manage-installed-extensions#monitor) of your installed extension, including checks on its health, usage, and logs.
