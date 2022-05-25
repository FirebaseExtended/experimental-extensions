"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.missingLastEventField = exports.invalidPrefixDocument = exports.transactionDeleteAttempt = exports.transactionWriteAttempt = exports.transactionReads = exports.context = exports.invalidObjectName = exports.skippedMissingPath = exports.skippedObject = exports.skippedOverwrite = exports.transactionFailure = exports.docDoesNotExist = exports.eventNotStale = exports.staleTieBreak = exports.abortingStaleEvent = exports.startingTransaction = exports.metadata = exports.startHttpEvent = exports.start = exports.error = void 0;
const config_1 = require("./config");
const constants_1 = require("./constants");
const error = (err, action) => {
    const message = action ? `Error while ${action}:` : "Error:";
    console.error(message, err);
};
exports.error = error;
const start = () => {
    console.log("Started Function execution with Configuration:", config_1.default);
};
exports.start = start;
const startHttpEvent = () => {
    console.log("Started Http Function execution with Configuration:", config_1.default);
};
exports.startHttpEvent = startHttpEvent;
const metadata = (m) => {
    console.log(`Event triggered with Object metadata: ${JSON.stringify(m)}`);
};
exports.metadata = metadata;
const startingTransaction = (path, attemptNo) => {
    console.log(`Starting Transaction attempt number ${attemptNo} for Item Document: ${path}`);
};
exports.startingTransaction = startingTransaction;
const abortingStaleEvent = (path, eventTime, existingTime) => {
    console.log("Aborting update of " +
        path +
        " because incoming timestamp (" +
        eventTime +
        ") is older than existing timestamp (" +
        existingTime +
        ")");
};
exports.abortingStaleEvent = abortingStaleEvent;
const staleTieBreak = (path, eventTime, existingTime) => {
    console.log("Aborting update of " +
        path +
        " because incoming timestamp (" +
        eventTime +
        ") is equal to existing timestamp (" +
        existingTime +
        ")");
};
exports.staleTieBreak = staleTieBreak;
const eventNotStale = (path, eventTime, existingTime) => {
    console.log("Update for " +
        path +
        "is stale because incoming timestamp (" +
        eventTime +
        ") is newer than existing timestamp (" +
        existingTime +
        ")");
};
exports.eventNotStale = eventNotStale;
const docDoesNotExist = (path) => {
    console.log(`${path} is not stale because it does not yet exist.`);
};
exports.docDoesNotExist = docDoesNotExist;
const transactionFailure = (path, reason) => {
    console.error(`Transaction to update ${path} failed because:`, reason);
};
exports.transactionFailure = transactionFailure;
const skippedOverwrite = (name, eventType) => {
    console.log(`Skipped write for ${eventType} event on ${name} because the object exists. This was likely an overwrite of the object.`);
};
exports.skippedOverwrite = skippedOverwrite;
const skippedObject = (name) => {
    console.log(`Skipping Object with name not matching filter: ${name}`);
};
exports.skippedObject = skippedObject;
const skippedMissingPath = (name) => {
    console.log(`Skipping mirroring of path "${name}" because no data was found in Firestore or GCS`);
};
exports.skippedMissingPath = skippedMissingPath;
const invalidObjectName = (name) => {
    console.log(`Skipping Object with invalid name: ${name}`);
};
exports.invalidObjectName = invalidObjectName;
const context = (m) => {
    console.log("Event Context", m);
};
exports.context = context;
const transactionReads = (paths) => {
    console.log(`This transaction read ${paths.length} documents: ${paths}`);
};
exports.transactionReads = transactionReads;
const transactionWriteAttempt = (num, paths) => {
    console.log(`Attempting to write ${num} documents: ${paths}`);
};
exports.transactionWriteAttempt = transactionWriteAttempt;
const transactionDeleteAttempt = (num, paths) => {
    console.log(`Attempting to delete ${num} documents: ${paths}`);
};
exports.transactionDeleteAttempt = transactionDeleteAttempt;
const invalidPrefixDocument = (id) => {
    console.log(`Missing fields in Prefix Document with id: ${id} treating the Document as requiring deletion.`);
};
exports.invalidPrefixDocument = invalidPrefixDocument;
const missingLastEventField = (id) => {
    console.log(`Missing ${constants_1.Constants.lastEventField} field in Document with id: ${id}, treating as stale.`);
};
exports.missingLastEventField = missingLastEventField;
