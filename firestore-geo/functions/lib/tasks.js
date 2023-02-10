"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueTask = void 0;
const functions_1 = require("firebase-admin/functions");
async function enqueueTask(address, docId) {
    // Retry the request if it fails.
    const queue = (0, functions_1.getFunctions)().taskQueue(`ext-${process.env.EXT_INSTANCE_ID}-updateLatLong`, process.env.EXT_INSTANCE_ID);
    await queue.enqueue({
        name: docId,
        address: address,
        docId: docId,
    }, 
    // Retry the request after 30 days.
    { scheduleDelaySeconds: 30 * 24 * 60 * 60 });
}
exports.enqueueTask = enqueueTask;
//# sourceMappingURL=tasks.js.map