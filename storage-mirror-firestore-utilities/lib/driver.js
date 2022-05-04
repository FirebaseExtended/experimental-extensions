"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const storage_1 = require("@google-cloud/storage");
const commander = require("commander");
const faker_1 = require("@faker-js/faker");
const admin = require("firebase-admin");
const lodash = require("lodash");
const ora = require("ora");
const winston = require("winston");
const functions_1 = require("@google-cloud/functions");
const inquirer = require("inquirer");
const await_semaphore_1 = require("await-semaphore");
const google_auth_library_1 = require("google-auth-library");
class PromiseQueue {
    constructor() {
        this.startIdx = 0;
        this.endIdx = 0;
        this.contents = {};
    }
    /**
     * Returns the current size of this Promise Queue.
     */
    size() {
        return this.endIdx - this.startIdx;
    }
    /**
     * Enqueues a new Promise into the Promise Queue.
     */
    enqueue(promise) {
        this.contents[this.endIdx] = promise;
        this.endIdx++;
    }
    /**
     * Returns the oldest Promise in the Promise Queue.
     */
    dequeue() {
        if (this.startIdx !== this.endIdx) {
            const promise = this.contents[this.startIdx];
            delete this.contents[this.startIdx];
            this.startIdx++;
            return promise;
        }
        throw "dequeue should not be called on empty PromiseQueue";
    }
    /**
     * Returns a Promise that resolves when all the Promises inside the Promise Queue resolve.
     */
    onEmpty() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(Object.values(this.contents));
        });
    }
}
/**
 * Add a promise to the Promise Queue.
 * @param promises The Promise Queue to add to.
 * @param newPromise The new Promise to add to the Promise Queue.
 * @param maxConcurrentRequests The maximum number of concurrent requests.
 */
const addToPromiseQueue = (promises, newPromise, maxConcurrentRequests) => __awaiter(void 0, void 0, void 0, function* () {
    // Limit the number of pending requests to save on memory.
    if (promises.size() >= maxConcurrentRequests) {
        yield promises.dequeue();
    }
    promises.enqueue(newPromise);
});
/**
 * Create a Winston Logger for the given log file name.
 * @param logFile The file name for the log file to write to.
 */
const createLogger = (logFile) => {
    return winston.createLogger({
        level: "info",
        format: winston.format.json(),
        levels: {
            // Levels are reversed because potentially many errors will be found and these need to be logged.
            // Both info and errors are logged to file, info logs are sent to the console.
            info: 0,
            error: 1,
        },
        transports: [
            new winston.transports.File({
                filename: logFile,
                level: "error",
            }),
            new winston.transports.Console({
                level: "info",
                format: winston.format.cli(),
            }),
        ],
    });
};
/**
 * Return the number of seconds between now and a given Epoch time in milliseconds.
 * @param time Time in milliseconds since Epoch time.
 */
const secondsSinceTime = (time) => (Date.now() - time) / 1000;
/**
 * Prune any leading, trailing or extraneous slashes from a file path prefix if there are any.
 * @param prefix The prefix to prune.
 */
const prunePrefix = (prefix) => {
    return prefix
        .split("/")
        .filter((part) => part.length > 0)
        .join("/");
};
/**
 * Get the Firestore Item Document path from the given Object name.
 * @param constants Consistency Check constants.
 * @param bucket The bucket
 * @param name The Object name.
 */
const objectNameToFirestorePath = (constants, bucket, name) => {
    const parts = name.split("/");
    const fileName = parts[parts.length - 1];
    let prefix = `${constants.root}/${bucket}`;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        prefix += `/${constants.prefixes}/${part}`;
    }
    return `${prefix}/${constants.items}/${fileName}`;
};
const writeCmd = new commander.Command("write")
    .allowUnknownOption(false)
    .description("generate load tasks for stress test load runner in RTDB")
    .requiredOption("-b, --bucket <bucket>", "bucket to write to")
    .requiredOption("-d, --database <database-name>", "the name of the realtime database instance to write tasks to, example: https://<database-name>.firebaseio.com")
    .option("-p, --prefix <prefix>", "prefix for all generated file paths to be under (trailing slash optional)", "")
    .option("-t, --test <namespace>", "use local emulator with namespace")
    .option("-m, --max-pending-tasks <number>", "maximum number of tasks in queue", "200")
    .option("-s, --sets-per-task <number>", "number of operation sets per task to run in parallel", "5")
    .option("-o, --operations-per-set <number>", "number of operations per operation set", "10")
    .option("-n, --tasks-per-second <number>", "max number of tasks pushed per second", "50")
    .option("-i, --interval <number>", "interval in milliseconds between pushing tasks", "1000")
    .option("-l, --log-file <filename>", "file to store all logs", "write.log")
    .option("--project <project_id>", "project to run this stress test on")
    .action((cmd) => __awaiter(void 0, void 0, void 0, function* () {
    const config = {
        bucket: cmd.bucket,
        database: cmd.database,
        project: cmd.project,
        prefix: cmd.prefix,
        maxPendingTasks: parseInt(cmd.maxPendingTasks),
        setsPerTask: parseInt(cmd.setsPerTask),
        operationsPerSet: parseInt(cmd.operationsPerSet),
        tasksPerSecond: parseInt(cmd.tasksPerSecond),
        interval: parseInt(cmd.interval),
        logFile: cmd.logFile,
    };
    config.prefix = prunePrefix(config.prefix);
    const integerFields = [
        "maxPendingTasks",
        "setsPerTask",
        "operationsPerSet",
        "tasksPerSecond",
        "interval",
    ];
    integerFields.forEach((field) => {
        if (!(config[field] >= 1)) {
            throw new Error(`Invalid ${field}`);
        }
    });
    if (!cmd.bucket)
        throw new Error("Bucket must be specified.");
    const state = {
        spinner: ora(),
        logger: createLogger(config.logFile),
        mode: "running",
        startTime: Date.now(),
        tasksInQueue: 0,
        tasksLastPushed: 0,
        tasksTotal: 0,
        tasksNumErrors: 0,
        tasksPerSecond: 0,
    };
    // Initialize Admin SDK using either local emulator or service account key file.
    if (cmd.test) {
        admin.initializeApp({
            databaseURL: `http://localhost:9000/?ns=${cmd.test}`,
        });
        state.logger.info(`Using local Emulator Database with Namespace: ${cmd.test}`);
    }
    else {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            databaseURL: `https://${config.database}.firebaseio.com/`,
            projectId: config.project,
        });
    }
    // Setup finished, can start Stress Test.
    state.logger.info("Starting Stress Test with configuration:");
    state.logger.info(JSON.stringify(config));
    state.logger.info(`Logging to ${config.logFile}.`);
    const db = admin.database();
    db.ref()
        .child("tasks")
        .on("value", (snapshot) => {
        state.tasksInQueue = snapshot.numChildren();
    });
    db.ref()
        .child("errors")
        .on("value", (snapshot) => {
        state.tasksNumErrors = snapshot.numChildren();
    });
    const taskPushInterval = setInterval(() => {
        const tasksPushed = pushTasks(config, state.tasksInQueue);
        const secondsElapsed = secondsSinceTime(state.startTime);
        state.tasksLastPushed = tasksPushed;
        state.tasksTotal += tasksPushed;
        state.tasksPerSecond = state.tasksTotal / secondsElapsed;
    }, config.interval);
    setInterval(() => {
        updateWriteSpinner(state);
    }, 1000);
    // Listen to stdin for events to stop the Stress Test or force-quit.
    if (!process.stdin.setRawMode)
        throw new Error("Stdin Raw Mode not supported.");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const char = data.toString();
        if (char === "q" || char === "Q") {
            state.logger.info("Force Quitting...");
            process.exit(0);
        }
        if (state.mode === "running") {
            // Wait for the Task queue to clear out before continuing.
            clearInterval(taskPushInterval);
            state.mode = "waiting";
        }
        else if (state.mode === "waiting") {
            state.spinner.stop();
            state.logger.info("Cleaning up RTDB...");
            const tasksTotal = state.tasksTotal;
            const tasksNumErrors = state.tasksNumErrors;
            const tasksPerSecond = state.tasksPerSecond;
            const avgQps = tasksPerSecond * config.setsPerTask * config.operationsPerSet;
            const secondsElapsed = secondsSinceTime(state.startTime);
            yield db.ref().child("tasks").remove();
            yield db.ref().child("errors").remove();
            state.logger.info(`Pushed ${tasksTotal} tasks total at a rate of ${tasksPerSecond}/s over ${secondsElapsed} seconds with ${tasksNumErrors} task errors. Average QPS: ${avgQps}\n`);
            process.exit(0);
        }
    }));
    state.spinner.start();
}));
/**
 * Update the spinner with relevant text for the current Stess Test writing state.
 * @param state The current Stress Test write state.
 */
const updateWriteSpinner = (state) => {
    const secondsElapsed = secondsSinceTime(state.startTime);
    if (state.mode === "running") {
        state.spinner.text = `Pushing tasks: ${state.tasksInQueue} Tasks in queue, ${state.tasksTotal} Tasks pushed so far, ${state.tasksNumErrors} Task Errors so far, pushed ${state.tasksLastPushed} last interval, average: ${state.tasksPerSecond.toFixed(2)}/s\n`;
        state.spinner.text += `Press 'q' to Force Quit, press any key to stop.\n`;
    }
    else if (state.mode === "waiting") {
        if (state.tasksInQueue > 0) {
            state.spinner.text = `Waiting for tasks to finish... ${state.tasksInQueue} tasks left in queue.\n`;
        }
        else {
            state.spinner.text = "No tasks remaining.\n";
        }
        state.spinner.text +=
            "Press any key to clean up and exit or press 'q' to exit without cleaning up.\n";
    }
    state.spinner.text += `Running for ${secondsElapsed} seconds.\n`;
};
/**
 * Generate a random file path to be written to. If a Prefix is configured it will be prefixed with it.
 * @param prefix The prefix for the generated file paths.
 */
const createPath = (prefix) => {
    // Number added at the end to improve uniqueness.
    const filePath = faker_1.faker.system.filePath().substr(1) + faker_1.faker.datatype.number().toString();
    if (prefix.length > 0) {
        return `${prefix}/${filePath}`;
    }
    return `${filePath}`;
};
/**
 * Generate a random Operation using the provided path, and operation type.
 * @param path The path to be used in the Operation.
 * @param type The Operation Type that should be generated.
 * @param minFileSize Minimum file size for the file being written.
 * @param maxFileSize Maximum file size for the file being written.
 */
const createOperation = (path, type, minFileSize, maxFileSize) => {
    switch (type) {
        case "write":
            if (!maxFileSize || !minFileSize)
                throw new Error("File sizes need to be specified for Write operations.");
            return {
                type: "write",
                path,
                size: selectFileSize(maxFileSize, minFileSize),
            };
        case "update":
            return {
                type: "update",
                path,
                metadata: { [faker_1.faker.name.firstName()]: faker_1.faker.name.lastName() },
            };
        case "delete":
            return { type: "delete", path };
    }
};
/**
 * Generate a random Operation using the provided path, and operation type.
 * @param path The path to be used in the Operation.
 * @param type The Operation Type that should be generated.
 */
const createOperationSet = (path, operationsPerSet) => {
    const minFileSize = 2;
    const maxFileSize = 100;
    const set = [];
    // Operation Sets need to start with a write, can't update or delete a file that doesn't exist.
    set.push(createOperation(path, "write", minFileSize, maxFileSize));
    for (let i = 1; i < operationsPerSet; i++) {
        if (set[i - 1].type === "delete") {
            // Can only write after deleting.
            set.push(createOperation(path, "write", minFileSize, maxFileSize));
            continue;
        }
        set.push(createOperation(path, selectOperation(), minFileSize, maxFileSize));
    }
    return set;
};
const selectOperation = () => {
    const rand = Math.random();
    if (rand < 0.33) {
        return "write";
    }
    else if (rand < 0.66) {
        return "update";
    }
    else {
        return "delete";
    }
};
const selectFileSize = (max, min) => Math.floor(Math.random() * max) + min;
/**
 * Generate a Task using whatever configuration values were set.
 * @param bucket GCS Bucket for files to be written to.
 * @param prefix The prefix for the generated file paths.
 * @param setsPerTask The number of Operation Sets to be run in parallel in a task.
 * @param operationsPerSet The number of Operations in each Operation Set to be run sequentially.
 */
const createTask = (bucket, prefix, setsPerTask, operationsPerSet) => {
    // Create n Operation Sets for the Task.
    const operationSets = [];
    for (let i = 0; i < setsPerTask; i++) {
        const path = createPath(prefix);
        operationSets.push(createOperationSet(path, operationsPerSet));
    }
    return {
        bucket: bucket,
        operations: operationSets,
    };
};
/**
 * Push tasks to RTDB, the number of Tasks pushed depends on the state of the Task queue and the
 * configured settings.
 * @param config The Stress Test Configuration.
 * @param tasksInQueue The number of tasks currently enqueued.
 */
const pushTasks = (config, tasksInQueue) => {
    const db = admin.database();
    const updates = {};
    // Whatever is less, the max Tasks/second or the difference between the current number of Tasks and the max.
    // Push these tasks divided across `intervals` every second.
    const numTasksToPush = Math.floor(Math.min(config.tasksPerSecond, Math.max(0, config.maxPendingTasks - tasksInQueue)) /
        (1000 / config.interval));
    if (numTasksToPush === 0)
        return 0;
    // Create n tasks and batch the update for RTDB.
    for (let i = 0; i < numTasksToPush; i++) {
        const task = createTask(config.bucket, config.prefix, config.setsPerTask, config.operationsPerSet);
        const key = db.ref().child("tasks").push().key;
        if (key == null)
            break;
        updates[key] = task;
    }
    db.ref().child("tasks").update(updates);
    return numTasksToPush;
};
function confirm(prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        const questions = [
            {
                type: "confirm",
                name: "confirmed",
                message: prompt,
            },
        ];
        const answers = yield inquirer.prompt(questions);
        return answers["confirmed"];
    });
}
const backfillCmd = new commander.Command("backfill")
    .allowUnknownOption(false)
    .description("backfill data from gcs into firestore")
    .option("--project <project_id>", "project id which has the extension installed")
    .option("--instance-id <extension_instance_id>", "instance id of the extension (which can be found with `firebase ext:list`).")
    .option("-c, --concurrency <concurrency>", "Number of requests in flight at a time.", "50")
    // TODO: Add option to specify a prefix.
    .action((command) => __awaiter(void 0, void 0, void 0, function* () {
    const cmd = command;
    const concurrency = parseInt(cmd.concurrency);
    if (!(concurrency >= 1)) {
        throw "Invalid concurrency";
    }
    const clientOptions = cmd.project ? { projectId: cmd.project } : undefined;
    const client = new functions_1.CloudFunctionsServiceClient(clientOptions);
    const projectId = yield client.getProjectId();
    console.log(`Using project: ${projectId}`);
    const parent = `projects/${projectId}/locations/-`;
    // The page size is 1001 to ensure that the results come back in one page.
    const [allFunctions] = yield client.listFunctions({
        parent: parent,
        pageSize: 1001,
    });
    // Get all of the mirrorObjectPathHttp functions.
    const mirrorFunctions = allFunctions.filter((f) => {
        // All functions installed for extensions have labels.
        if (!f.labels) {
            return false;
        }
        // Make sure the function is part of this extension.
        const isExtension = f.labels["deployment-tool"] === "firebase-extensions" &&
            f.labels["goog-firebase-ext"] === "storage-mirror-firestore";
        if (!isExtension) {
            return false;
        }
        // If the user specified an extension instance id, filter on that.
        if (cmd.instanceId) {
            if (f.labels["goog-firebase-ext-iid"] !== cmd.instanceId) {
                return false;
            }
        }
        return f.entryPoint === "mirrorObjectPathHttp";
    });
    if (mirrorFunctions.length === 0) {
        throw "Extension doesn't appear to be installed for this project";
    }
    let extensionId = "";
    if (mirrorFunctions.length > 1) {
        const extIds = mirrorFunctions.map((f) => {
            return f.labels["goog-firebase-ext-iid"];
        });
        const questions = [
            {
                type: "list",
                choices: extIds,
                name: "extension-id",
                message: "Choose an extension id",
            },
        ];
        const answer = yield inquirer.prompt(questions);
        extensionId = answer["extension-id"];
    }
    else {
        extensionId = mirrorFunctions[0].labels["goog-firebase-ext-iid"];
    }
    const httpFunction = mirrorFunctions.find((f) => f.labels["goog-firebase-ext-iid"] === extensionId);
    const config = httpFunction.environmentVariables;
    const bucketName = config["BUCKET"];
    {
        const prompt = `Are you sure you want to mirror objects from ${bucketName} into Firestore for the project ${projectId}?`;
        if (!(yield confirm(prompt))) {
            throw "aborted";
        }
    }
    const authClient = new google_auth_library_1.GoogleAuth({
        projectId: projectId,
    });
    // This calls our http trigger for one path.
    const mirrorPath = (path) => __awaiter(void 0, void 0, void 0, function* () {
        yield authClient.request({
            url: httpFunction.httpsTrigger.url,
            method: "POST",
            data: { path: path },
            retryConfig: {
                retry: 3,
            },
        });
    });
    console.log(`Mirroring objects in bucket: ${bucketName}`);
    let succeeded = 0;
    const spinner = ora("Starting");
    spinner.start();
    const startTime = Date.now();
    const intervalId = setInterval(() => {
        // TODO: display more recent qps (with an exponential filter).
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const speed = Math.floor((10 * succeeded) / elapsed) / 10; // Hack to get one digit after the decimal point.
        spinner.text = `Mirrored ${succeeded} paths in ${elapsed}s. Avg throughput: ${speed} tasks/sec.`;
    }, 1000);
    const semaphore = new await_semaphore_1.Semaphore(concurrency);
    try {
        const storage = new storage_1.Storage();
        const bucket = storage.bucket(bucketName);
        let erroredPath = undefined;
        let pageToken = "";
        while (pageToken != null) {
            const [files, _, response] = yield bucket.getFiles({
                autoPaginate: false,
                pageToken,
            });
            for (let f of files) {
                const path = f.name;
                const release = yield semaphore.acquire();
                if (erroredPath) {
                    console.error(`Error attempting to mirror path ${erroredPath[0]}`, erroredPath[1]);
                    throw erroredPath[1];
                }
                mirrorPath(path)
                    .then((_) => {
                    succeeded += 1;
                    release();
                })
                    .catch((err) => {
                    if (!erroredPath) {
                        erroredPath = [path, err];
                    }
                    release();
                });
            }
            pageToken = response.nextPageToken || null;
        }
        // To wait for requests to finish, we acquire all the semaphore capacity.
        for (let i = 0; i < concurrency; i++) {
            yield semaphore.acquire();
            if (erroredPath) {
                console.error(`Error attempting to mirror path ${erroredPath[0]}`, erroredPath[1]);
                throw erroredPath[1];
            }
        }
    }
    catch (e) {
        clearInterval(intervalId);
        spinner.fail();
        throw e;
    }
    clearInterval(intervalId);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    spinner.succeed(`Mirrored ${succeeded} paths in ${elapsed}s.`);
}));
const cleanTombstonesCommand = new commander.Command("clean-tombstones")
    .allowUnknownOption(false)
    .description("delete tombstone records from firestore")
    .option("--project <project_id>", "project id which has the extension installed")
    .option("--instance-id <extension_instance_id>", "instance id of the extension (which can be found with `firebase ext:list`).", "storage-mirror-firestore")
    .action((command) => __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a, e_2, _b;
    const options = command;
    const auth = new google_auth_library_1.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/firebase.readonly"],
    });
    const authClient = yield auth.getClient();
    const projectId = options.project || (yield auth.getProjectId());
    let instance;
    let url = `https://firebaseextensions.googleapis.com/v1beta/projects/${projectId}/instances/${options.instanceId}`;
    try {
        const response = yield authClient.request({ url });
        instance = response.data;
    }
    catch (e) {
        if ((e === null || e === void 0 ? void 0 : e.code) === 404) {
            console.error(`Extension instance '${options.instanceId}' on project '${projectId}' was not found.`);
            process.exit(1);
        }
        throw e;
    }
    if (instance.state !== "ACTIVE") {
        console.error(`Extension instance '${options.instanceId}' on project '${projectId}' is not active.`);
        return;
    }
    const prompt = `Are you sure you want to delete tombstone records from Firestore for the project '${projectId}' and instance '${options.instanceId}'?`;
    if (!(yield confirm(prompt))) {
        process.exit(0);
    }
    console.log("\nScanning project for tombstone records...\n");
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId,
    });
    let countOfTombstones = 0;
    const writer = admin.firestore().bulkWriter();
    const itemTombstonesCollectionGroup = admin
        .firestore()
        .collectionGroup(instance.config.params.ITEMS_TOMBSTONES_NAME);
    // Using a partition size that worked well in testing on other
    // extension scripts (e.g. the BigQuery import script).
    const partitionSize = 300;
    const itemTombstonesPartitions = itemTombstonesCollectionGroup.getPartitions(partitionSize);
    try {
        for (var itemTombstonesPartitions_1 = __asyncValues(itemTombstonesPartitions), itemTombstonesPartitions_1_1; itemTombstonesPartitions_1_1 = yield itemTombstonesPartitions_1.next(), !itemTombstonesPartitions_1_1.done;) {
            const partition = itemTombstonesPartitions_1_1.value;
            const partitionSnapshot = yield partition.toQuery().get();
            const documents = partitionSnapshot.docs;
            for (const document of documents) {
                // Only delete if the path matches the extensions configured Firestore root.
                if (document.exists &&
                    document.ref.path.startsWith(instance.config.params.FIRESTORE_ROOT)) {
                    countOfTombstones++;
                    writer.delete(document.ref);
                }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (itemTombstonesPartitions_1_1 && !itemTombstonesPartitions_1_1.done && (_a = itemTombstonesPartitions_1.return)) yield _a.call(itemTombstonesPartitions_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    const prefixTombstonesCollectionGroup = admin
        .firestore()
        .collectionGroup(instance.config.params.PREFIXES_TOMBSTONES_NAME);
    const prefixTombstonesPartitions = prefixTombstonesCollectionGroup.getPartitions(42);
    try {
        for (var prefixTombstonesPartitions_1 = __asyncValues(prefixTombstonesPartitions), prefixTombstonesPartitions_1_1; prefixTombstonesPartitions_1_1 = yield prefixTombstonesPartitions_1.next(), !prefixTombstonesPartitions_1_1.done;) {
            const partition = prefixTombstonesPartitions_1_1.value;
            const partitionSnapshot = yield partition.toQuery().get();
            const documents = partitionSnapshot.docs;
            for (const document of documents) {
                // Only delete if the path matches the extensions configured Firestore root.
                if (document.exists &&
                    document.ref.path.startsWith(instance.config.params.FIRESTORE_ROOT)) {
                    countOfTombstones++;
                    writer.delete(document.ref);
                }
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (prefixTombstonesPartitions_1_1 && !prefixTombstonesPartitions_1_1.done && (_b = prefixTombstonesPartitions_1.return)) yield _b.call(prefixTombstonesPartitions_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    if (countOfTombstones > 0) {
        console.log(`Found a total of ${countOfTombstones} tombstone documents to remove. Cleaning up documents...`);
        yield writer.close();
        console.log(`Cleanup successful!`);
    }
    else {
        console.log(`No tombstone records found.`);
    }
}));
const checkCmd = new commander.Command("check")
    .allowUnknownOption(false)
    .description("check for consistency between GCS and Firestore")
    .requiredOption("-b, --bucket <bucket>", "bucket to check")
    .option("-p, --prefix <prefix>", "prefix for all generated file paths to be under", "")
    .option("-l, --log-file <filename>", "file to store all logs", "consistency.log")
    .option("--no-firestore", "skip firestore check")
    .option("--no-gcs", "skip gcs check")
    .option("--project <project_id>", "project to run this stress test on")
    .action((cmd) => __awaiter(void 0, void 0, void 0, function* () {
    const constants = {
        items: "items",
        prefixes: "prefixes",
        root: "gcs-mirror",
        metadataField: "gcsMetadata",
        customMetadata: "metadata",
        maxConcurrentRequests: 100,
    };
    const config = {
        bucket: cmd.bucket,
        project: cmd.project,
        prefix: cmd.prefix,
        logFile: cmd.logFile,
        checkFirestore: cmd.firestore ? true : false,
        checkGcs: cmd.gcs ? true : false,
    };
    if (!cmd.bucket)
        throw new Error("Bucket must be specified.");
    const state = {
        spinner: ora(),
        logger: createLogger(config.logFile),
        startTime: Date.now(),
        numInconsistencies: 0,
        firestoreNumItems: 0,
        firestoreNumItemsChecked: 0,
        firestorePrefixesRemaining: 0,
        storageNumFiles: 0,
        storageNumFilesChecked: 0,
        storagePrefixesRemaining: 0,
    };
    config.prefix = prunePrefix(config.prefix);
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: config.project,
    });
    // Setup finished, can start consistency check.
    state.logger.info("Starting Consistency Check with configuration:");
    state.logger.info(JSON.stringify(config));
    state.logger.info(`Any inconsistencies will be logged to ${config.logFile}.`);
    state.spinner.start();
    setInterval(() => {
        updateCheckSpinner(state);
    }, 1000);
    yield consistencyCheck(config, state, constants);
    state.spinner.stop();
    state.logger.info(`${state.numInconsistencies} Inconsistencies found.`);
    state.logger.info(`${state.firestoreNumItemsChecked} Firestore Documents for ${state.storageNumFilesChecked} GCS Objects.`);
    const secondsElapsed = secondsSinceTime(state.startTime);
    state.logger.info(`Consistency Check finished in ${secondsElapsed}s`);
    process.exit(0);
}));
/**
 * Update the spinner with relevant text for the current consistency check state.
 * @param state The current consistency check state.
 */
const updateCheckSpinner = (state) => {
    state.spinner.text = `Checking Consistency... \n`;
    state.spinner.text += `Checking Firestore Documents for non-existent paths: ${state.firestoreNumItemsChecked}/${state.firestoreNumItems} Documents checked`;
    if (state.firestorePrefixesRemaining > 0 ||
        state.firestoreNumItemsChecked <= state.firestoreNumItems) {
        state.spinner.text += `, Prefixes Remaining: ${state.firestorePrefixesRemaining}\n`;
    }
    else {
        state.spinner.text += `, Finished! ✔️\n`;
    }
    state.spinner.text += `Checking GCS for corresponding Firestore Documents: ${state.storageNumFilesChecked}/${state.storageNumFiles} Files checked`;
    if (state.storagePrefixesRemaining > 0 ||
        state.storageNumFilesChecked <= state.storageNumFiles) {
        state.spinner.text += `, Prefixes Remaining: ${state.storagePrefixesRemaining}\n`;
    }
    else {
        state.spinner.text += `, Finished! ✔️\n`;
    }
    state.spinner.text += `${state.numInconsistencies} Inconsistencies found so far.\n`;
    state.spinner.text += `Running for ${secondsSinceTime(state.startTime)} seconds.\n`;
};
/**
 * Run a consistency check on Firestore against GCS contents and GCS against the mirrored data in Firestore.
 * @param config The Consistency Check Config.
 * @param state The Consistency Check State.
 * @param constants The Consistency Check Constants.
 */
const consistencyCheck = (config, state, constants) => __awaiter(void 0, void 0, void 0, function* () {
    const checks = [];
    // Check Firestore for consistency.
    if (config.checkFirestore) {
        checks.push(checkFirestore(config, state, constants, (err) => {
            state.logger.error(err);
            state.numInconsistencies += 1;
        }));
    }
    // Check GCS for consistency.
    if (config.checkGcs) {
        checks.push(checkStorage(config, state, constants, (err) => {
            state.logger.error(err);
            state.numInconsistencies += 1;
        }));
    }
    yield Promise.all(checks);
});
/**
 * Check Firestore for consistency with GCS, run the provided callback if a Firestore document exists but
 * a corresponding GCS Object cannot be found.
 * @param config The Consistency Check Config.
 * @param state The Consistency Check State.
 * @param constants The Consistency Check Constants.
 * @param onInconsistency Callback function to run in the case of an inconsistency.
 */
const checkFirestore = (config, state, constants, onInconsistency) => __awaiter(void 0, void 0, void 0, function* () {
    const firestore = admin.firestore();
    const bucket = admin.storage().bucket(config.bucket);
    // Create the root Prefix Document path.
    let rootPrefix = `${constants.root}/${config.bucket}`;
    if (config.prefix.length > 0) {
        const parts = config.prefix.split("/");
        parts.forEach((part) => {
            rootPrefix += `/${constants.prefixes}/${part}`;
        });
    }
    // Depth-first traversal through Firestore, adding newly discovered Prefixes onto the stack.
    const prefixes = [rootPrefix];
    const promises = new PromiseQueue();
    while (prefixes.length > 0) {
        const currPrefix = prefixes.pop();
        // Paginate requests to Firestore to preserve memory.
        const prefixesPromise = new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            const prefixesSnapshot = yield firestore
                .collection(`${currPrefix}/${constants.prefixes}`)
                .get();
            const prefixDocs = prefixesSnapshot.docs;
            // Add discovered Prefixes to the stack.
            prefixDocs.forEach((doc) => prefixes.push(doc.ref.path));
            resolve(prefixDocs.length);
        }));
        const itemPromise = new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            let length = 0;
            let itemsSnapshot = null;
            while (itemsSnapshot == null || itemsSnapshot.docs.length > 0) {
                itemsSnapshot = yield firestore
                    .collection(`${currPrefix}/${constants.items}`)
                    .orderBy(`${constants.metadataField}.name`)
                    .startAfter(itemsSnapshot
                    ? itemsSnapshot.docs[itemsSnapshot.docs.length - 1]
                    : null)
                    .limit(1000)
                    .get();
                const itemDocs = itemsSnapshot.docs;
                length += itemDocs.length;
                state.firestoreNumItems += itemDocs.length;
                // Consistency check for discovered Item Documents.
                for (let i = 0; i < itemDocs.length; i++) {
                    const doc = itemDocs[i];
                    const name = doc.data()[constants.metadataField].name;
                    const fileExistsPromise = bucket
                        .file(name)
                        .exists()
                        .then(([exists]) => {
                        state.firestoreNumItemsChecked += 1;
                        if (!exists) {
                            // The Item Document should correspond to a Object in GCS.
                            onInconsistency(`The Firestore Document(${doc.ref.path}) represents a non-existent GCS location: ${name}`);
                        }
                    });
                    yield addToPromiseQueue(promises, fileExistsPromise, constants.maxConcurrentRequests);
                }
            }
            resolve(length);
        }));
        const [prefixDocsLength, itemDocsLength] = (yield Promise.all([
            prefixesPromise,
            itemPromise,
        ]));
        // Consistency check for Prefix Document.
        if (itemDocsLength === 0 && prefixDocsLength === 0) {
            if (currPrefix === rootPrefix) {
                onInconsistency(`The Root Prefix Document(${currPrefix}) for ${config.prefix} does not exist or is empty.`);
            }
            // The Prefix Document should contain members.
            onInconsistency(`The Prefix Document(${currPrefix}) exists but does not contain any Items or Prefixes, it should have been Tombstoned.`);
        }
        state.firestorePrefixesRemaining = prefixes.length;
        state.firestoreNumItems += itemDocsLength;
    }
    // Remaining requests need to finish before exiting.
    yield promises.onEmpty();
});
/**
 * Check GCS for consistency with Firestore, each GCS Object should have a corresponding Firestore Document
 * that contains the correct fields. A callback is run for each inconsistent Object.
 * @param config The Consistency Check Config.
 * @param state The Consistency Check State.
 * @param constants The Consistency Check Constants.
 * @param onInconsistency Callback function to run in the case of an inconsistency.
 */
const checkStorage = (config, state, constants, onInconsistency) => __awaiter(void 0, void 0, void 0, function* () {
    const firestore = admin.firestore();
    const bucket = admin.storage().bucket(config.bucket);
    const prefixes = [config.prefix];
    // Depth-first traversal through GCS, adding newly discovered Prefixes onto the stack.
    const promises = new PromiseQueue();
    while (prefixes.length > 0) {
        const currPrefix = prefixes.pop();
        // Paginate GCS query to preserve memory. Keep querying this Prefix until a pageToken is not returned.
        let pageToken = "";
        while (pageToken != null) {
            const [files, _, response] = yield bucket.getFiles({
                autoPaginate: false,
                delimiter: "/",
                prefix: currPrefix,
                pageToken,
            });
            pageToken = response.nextPageToken || null;
            // Prefixes field might be missing from response.
            const newPrefixes = response.prefixes || [];
            // Add newly discovered Prefixes to stack.
            newPrefixes.forEach((prefix) => prefixes.push(prefix));
            // Construct Firestore path for Prefix Document.
            let path = `${constants.root}/${config.bucket}`;
            const parts = currPrefix.split("/").filter((s) => s.length > 0);
            parts.forEach((part) => {
                path += `/${constants.prefixes}/${part}`;
            });
            // Check Prefix for consistency.
            const prefixDocExistsPromise = firestore
                .doc(path)
                .get()
                .then((doc) => {
                if (!doc.exists && files.length > 0) {
                    // GCS Prefix should have a corresponding Document in Firestore.
                    onInconsistency(`The Prefix Document(${doc.ref.path}) for ${path} is missing in Firestore even though the Prefix exists in GCS.`);
                }
            });
            yield addToPromiseQueue(promises, prefixDocExistsPromise, constants.maxConcurrentRequests);
            state.storageNumFiles += files.length;
            state.storagePrefixesRemaining = prefixes.length;
            // Check Files for consistency.
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const firestorePath = objectNameToFirestorePath(constants, config.bucket, file.name);
                const itemDocExistsPromise = firestore
                    .doc(firestorePath)
                    .get()
                    .then((snapshot) => {
                    state.storageNumFilesChecked += 1;
                    // Check the corresponding Firestore Document for consistency.
                    const err = validateDocument(constants, snapshot, file);
                    if (err) {
                        onInconsistency(err);
                    }
                });
                yield addToPromiseQueue(promises, itemDocExistsPromise, constants.maxConcurrentRequests);
            }
        }
    }
    // Remaining requests need to finish before exiting.
    yield promises.onEmpty();
});
/**
 * Check the given Firestore Document Snapshot against it's corresponding GCS Object for consistency.
 * @param constants The Consistency Check Constants.
 * @param snapshot Firestore Document Snapshot.
 * @param file File data corresponding to the GCS Object.
 */
const validateDocument = (constants, snapshot, file) => {
    if (!snapshot.exists) {
        // Item Document should exist for each GCS Object.
        return `The Item Document(${snapshot.ref.path}) for ${file.name} is missing in Firestore even though it exists in GCS.`;
    }
    else if (snapshot.data()[constants.metadataField].size !==
        Number(file.metadata.size)) {
        // Item Document should have correct size if the file was overwritten.
        return `The Item Document(${snapshot.ref.path}) for ${file.name} is stale in Firestore. It contains the incorrect size.`;
    }
    else if (!lodash.isEqual(snapshot.data()[constants.metadataField][constants.customMetadata], file.metadata.metadata)) {
        // Item Document should have the correct custom metadata.
        return `The Item Document(${snapshot.ref.path}) for ${file.name} is stale in Firestore. It contains out-of-date custom metadata.`;
    }
    // No inconsistencies were found.
    return null;
};
const cleanCmd = new commander.Command("clean")
    .allowUnknownOption(false)
    .description("clean up stress test from gcs and firestore")
    .requiredOption("-b, --bucket <bucket>", "bucket that was used when writing")
    .option("-p, --prefix <prefix>", "prefix that was used when writing", "")
    .option("--no-firestore", "skip firestore clean up")
    .option("--no-gcs", "skip gcs clean up")
    .option("-l, --log-file <filename>", "file to store all logs", "clean.log")
    .option("--project <project_id>", "project to run this stress test on")
    .action((cmd) => __awaiter(void 0, void 0, void 0, function* () {
    const constants = {
        items: "items",
        prefixes: "prefixes",
        root: "gcs-mirror",
        metadataField: "gcsMetadata",
        maxConcurrentRequests: 5000,
    };
    const config = {
        bucket: cmd.bucket,
        project: cmd.project,
        prefix: cmd.prefix,
        logFile: cmd.logFile,
        cleanFirestore: cmd.firestore ? true : false,
        cleanGcs: cmd.gcs ? true : false,
    };
    if (!cmd.bucket)
        throw new Error("Bucket must be specified.");
    const state = {
        spinner: ora(),
        logger: createLogger(config.logFile),
        firestoreNumItems: 0,
        firestoreNumItemsDeleted: 0,
        firestorePrefixesRemaining: 0,
        storageNumItems: 0,
        storageNumItemsDeleted: 0,
    };
    config.prefix = prunePrefix(config.prefix);
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: config.project,
    });
    // Setup finished, can start cleaning up.
    state.logger.info("Starting clean-up with configuration:");
    state.logger.info(JSON.stringify(config));
    state.logger.info(`Logging to ${config.logFile}.`);
    state.spinner.start();
    setInterval(() => {
        updateCleanSpinner(state);
    }, 1000);
    const cleanUpTasks = [];
    // Clean up GCS.
    if (config.cleanGcs) {
        cleanUpTasks.push(cleanStorage(constants, config, state));
    }
    // Clean up Firestore.
    if (config.cleanFirestore) {
        cleanUpTasks.push(cleanFirestore(constants, config, state));
    }
    yield Promise.all(cleanUpTasks);
    state.logger.info("Finished clean up!");
    state.logger.info(`Deleted ${state.firestoreNumItemsDeleted} Documents from Firestore.`);
    state.logger.info(`Deleted ${state.storageNumItemsDeleted} Objects from GCS.`);
    process.exit(0);
}));
const updateCleanSpinner = (state) => {
    state.spinner.text = `Cleaning up Firestore: ${state.firestoreNumItemsDeleted}/${state.firestoreNumItems} Documents deleted. Prefixes Remaining: ${state.firestorePrefixesRemaining}\n`;
    state.spinner.text += `Cleaning up GCS: ${state.storageNumItemsDeleted}/${state.storageNumItems} items deleted.\n`;
};
/**
 * Remove the GCS Objects generated by the Stress Test.
 * @param constants The Clean Up Constants.
 * @param config The Clean Up Config.
 * @param state The Clean Up State.
 */
const cleanStorage = (constants, config, state) => __awaiter(void 0, void 0, void 0, function* () {
    const bucket = admin.storage().bucket(config.bucket);
    const promises = new PromiseQueue();
    // Paginate GCS query to preserve memory. Keep querying this Prefix until a `pageToken` is not returned.
    let pageToken = "";
    while (pageToken != null) {
        const [files, _, response] = yield bucket.getFiles({
            autoPaginate: false,
            prefix: config.prefix,
            pageToken,
        });
        pageToken = response.nextPageToken || null;
        state.storageNumItems += files.length;
        // Delete Files from GCS.
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const deleteFilePromise = file
                .delete()
                .then(() => {
                state.storageNumItemsDeleted += 1;
            })
                .catch((err) => state.logger.error("Error deleting Object from GCS", err));
            yield addToPromiseQueue(promises, deleteFilePromise, constants.maxConcurrentRequests);
        }
    }
    yield promises.onEmpty();
});
/**
 * Remove the Firestore Documents generated by the Stress Test.
 * @param constants The Clean Up Constants.
 * @param config The Clean Up Config.
 * @param state The Clean Up State.
 */
const cleanFirestore = (constants, config, state) => __awaiter(void 0, void 0, void 0, function* () {
    const firestore = admin.firestore();
    // Construct the Root Prefix Document path.
    let rootPrefix = `${constants.root}/${config.bucket}`;
    if (config.prefix.length > 0) {
        const parts = config.prefix.split("/");
        parts.forEach((part) => {
            rootPrefix += `/${constants.prefixes}/${part}`;
        });
    }
    const prefixes = [rootPrefix];
    try {
        // Depth-first traversal through Firestore, adding newly discovered Prefixes onto the stack.
        const promises = new PromiseQueue();
        while (prefixes.length > 0) {
            const currPrefix = prefixes.pop();
            // Paginate requests to Firestore to preserve memory.
            const prefixesPromise = new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                const prefixesSnapshot = yield firestore
                    .collection(`${currPrefix}/${constants.prefixes}`)
                    .get();
                const prefixDocs = prefixesSnapshot.docs;
                // Add the newly discovered Prefixes to the stack.
                prefixDocs.forEach((doc) => {
                    prefixes.push(doc.ref.path);
                });
                resolve();
            }));
            const itemsPromise = new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                let length = 0;
                let itemsSnapshot = null;
                while (itemsSnapshot == null || itemsSnapshot.docs.length > 0) {
                    itemsSnapshot = yield firestore
                        .collection(`${currPrefix}/${constants.items}`)
                        .orderBy(`${constants.metadataField}.name`)
                        .startAfter(itemsSnapshot
                        ? itemsSnapshot.docs[itemsSnapshot.docs.length - 1]
                        : null)
                        .limit(1000)
                        .get();
                    const itemDocs = itemsSnapshot.docs;
                    length += itemDocs.length;
                    // Delete the Item Documents.
                    for (let i = 0; i < itemDocs.length; i++) {
                        const doc = itemDocs[i];
                        const deleteItemDocPromise = doc.ref
                            .delete()
                            .then(() => (state.firestoreNumItemsDeleted += 1));
                        yield addToPromiseQueue(promises, deleteItemDocPromise, constants.maxConcurrentRequests);
                    }
                }
                resolve(length);
            }));
            const [_, itemsDocsLength] = (yield Promise.all([
                prefixesPromise,
                itemsPromise,
            ]));
            state.firestorePrefixesRemaining = prefixes.length;
            state.firestoreNumItems += itemsDocsLength;
            // Delete the Prefix Document.
            const currPrefixSnapshot = firestore.doc(currPrefix);
            const deletePrefixDocPromise = currPrefixSnapshot.delete();
            yield addToPromiseQueue(promises, deletePrefixDocPromise, constants.maxConcurrentRequests);
        }
    }
    catch (e) {
        state.logger.error("Error cleaning up Firestore:", e);
    }
});
const rootCmd = new commander.Command("driver")
    .addCommand(writeCmd)
    .addCommand(checkCmd)
    .addCommand(backfillCmd)
    .addCommand(cleanTombstonesCommand)
    .addCommand(cleanCmd);
rootCmd.parseAsync(process.argv).catch((e) => {
    console.error(e);
    process.exit(1);
});
