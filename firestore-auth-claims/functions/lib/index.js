"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
admin.initializeApp();
const auth = admin.auth();
const CLAIMS_FIELD = process.env.CLAIMS_FIELD || null;
const CLAIMS_COLLECTION = process.env.CLAIMS_COLLECTION || "user_claims";
exports.sync = functions.firestore
    .document(CLAIMS_COLLECTION)
    .onWrite(async (change) => {
    const uid = change.after.id;
    try {
        // make sure the user exists (can be fetched) before trying to set claims
        await auth.getUser(uid);
    }
    catch (e) {
        functions.logger.error(`Unable to sync claims for user '${uid}', error:`, e, { uid });
    }
    if (!change.after.exists ||
        (CLAIMS_FIELD && !change.after.get(CLAIMS_FIELD))) {
        functions.logger.info(`Claims for user '${uid}' were deleted, removing from Auth.`, { uid });
        return auth.setCustomUserClaims(uid, null);
    }
    const beforeData = (CLAIMS_FIELD ? change.before.get(CLAIMS_FIELD) : change.before.data()) ||
        {};
    const data = (CLAIMS_FIELD ? change.after.get(CLAIMS_FIELD) : change.after.data()) ||
        {};
    // don't write the _synced field to Auth
    if (data._synced) {
        delete data._synced;
    }
    if (beforeData._synced) {
        delete beforeData._synced;
    }
    if ((0, util_1.isDeepStrictEqual)(beforeData, data)) {
        // don't persist identical claims
        return;
    }
    functions.logger.info(`Updating claims for user '${uid}', setting keys ${Object.keys(data).join(", ")}.`, { uid });
    if (typeof data !== "object") {
        functions.logger.error(`Invalid custom claims for user '${uid}'.
        Must be object, was ${JSON.stringify(data)}`, { uid });
        return;
    }
    await auth.setCustomUserClaims(uid, data);
    const fpath = ["_synced"];
    if (CLAIMS_FIELD) {
        fpath.unshift(CLAIMS_FIELD);
    }
    functions.logger.info(`Claims set for user '${uid}', logging sync time to Firestore`, { uid });
    return change.after.ref.update(new firestore_1.FieldPath(...fpath), firestore_1.FieldValue.serverTimestamp());
});
//# sourceMappingURL=index.js.map