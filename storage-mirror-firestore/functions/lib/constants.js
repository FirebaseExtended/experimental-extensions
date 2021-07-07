"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
class Constants {
}
exports.Constants = Constants;
// Extension Firestore Document Fields
Constants.lastEventField = "lastEvent";
Constants.childRefField = "childRef";
Constants.gcsMetadataField = "gcsMetadata";
// GCS Object Metadata Fields
Constants.objectCustomMetadataField = "metadata";
// Extension Constants
Constants.queryLimit = 5;
Constants.transactionAttempts = 5;
Constants.numberFields = ["size", "generation", "metageneration"];
Constants.dateFields = [
    "timeCreated",
    "timeStorageClassUpdated",
    "updated",
];
