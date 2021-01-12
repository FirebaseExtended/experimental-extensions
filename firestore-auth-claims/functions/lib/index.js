"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const auth = admin.auth();
const CLAIMS_FIELD = process.env.CLAIMS_FIELD || null;
exports.sync = functions.handler.firestore.document.onWrite(async (change) => {
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
    const data = (CLAIMS_FIELD ? change.after.get(CLAIMS_FIELD) : change.after.data()) || {};
    // don't write the _synced field to Auth
    if (data._synced) {
        delete data._synced;
    }
    if (beforeData._synced) {
        delete beforeData._synced;
    }
    if (util_1.isDeepStrictEqual(beforeData, data)) {
        // don't persist identical claims
        return;
    }
    functions.logger.info(`Updating claims for user '${uid}', setting keys ${Object.keys(data).join(", ")}.`, { uid });
    await auth.setCustomUserClaims(uid, data);
    const fpath = ["_synced"];
    if (CLAIMS_FIELD) {
        fpath.unshift(CLAIMS_FIELD);
    }
    functions.logger.info(`Claims set for user '${uid}', logging sync time to Firestore`, { uid });
    return change.after.ref.update(new admin.firestore.FieldPath(...fpath), admin.firestore.FieldValue.serverTimestamp());
});
//# sourceMappingURL=index.js.map