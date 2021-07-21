# Mirror Stress Test Tool

## Setup

* Run `npm install` in this directory.
* Please ensure your `GOOGLE_APPLICATION_CREDENTIALS` environment variable is set. You can find instructions [here](https://cloud.google.com/docs/authentication/production).
* Set your active project using `firebase use`.
* Install the Load Runner Cloud Function to your project using `npm run deploy`.

## Usage

For the three subcommands `write`, `check`, and `clean` you can find all arguments by providing the `--help` argument.

You may substitue all usages of `npm start --` with `node lib/driver.js` if you run `npm run build` beforehand.

It is recommended to provide the `--prefix="YOUR_PREFIX_HERE"` argument to each of these commands to contain your test
to a specific prefix in order to separate them.

The `--bucket` argument is required for all subcommands.

### Writing
Write Tasks to RTDB, there are three options here that influence the rate of GCS operations per second here.

* `--tasks-per-second` influences the number of tasks pushed per second to RTDB.
* `--sets-per-task` changes the number of operation sets are in a task, these are run in parallel.
* `--operations-per-set` determines how many operations are in each operation set, these are run sequentially.

Multiplying the above 3 numbers gets you the **target** number of GCS operations per second, the actual amount may be
less depending on how much of a backlog is created. You can modify ` --max-pending-tasks` to increase the maximum backlog.

```bash
npm start -- write --bucket="my-bucket.appspot.com" --database="my-bucket" --prefix="PREFIX_HERE"
```

### Consistency Check
Check the contents of GCS and Firestore for consistency. Each Object in GCS is checked to make sure that the corresponding
Firestore Document exists and is accurate. Each Document in Firestore is checked to make sure that it has an existing
GCS Object.

You can disable the first check with `--no-gcs` and the latter with `--no-firestore`.

```bash
npm start -- write --bucket="my-bucket.appspot.com" --database="my-bucket" --prefix="PREFIX_HERE"
```
### Cleaning Up
Clean up the artifacts created by the Write subcommand from GCS and Firestore.

This command may need to be run a second time on Firestore if the extension is enabled and modifying Firestore with the
deletes occurring in GCS.

You can disable the GCS clean-up with `--no-gcs` and the Firestore clean up with `--no-firestore`.

```bash
npm start -- clean --bucket="my-bucket.appspot.com" --prefix="PREFIX_HERE"
```

### Results
The extension has been tested with the following settings 
* maxPendingTasks: `2,000`
* setsPerTask: `20`
* operationsPerSet: `20`
* tasksPerSecond: `50`

For a target `20,000` operations per second. The actual measured rate was `12,969.66` operations per second.
The Stress Test pushed `68,018` tasks total at a rate of `32.42417135262633/s` over `3536.084` seconds.

Running the consistency check on the over one million Files generated revealed no inconsistencies with re-trying enabled!
