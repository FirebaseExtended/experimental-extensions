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
Object.defineProperty(exports, "__esModule", { value: true });
exports.mirrorObjectPathHttp = exports.mirrorArchive = exports.mirrorDelete = exports.mirrorMetadataUpdate = exports.mirrorFinalize = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const logs = require("./logs");
const mirror_1 = require("./mirror");
// Initialize the Firebase Admin SDK
admin.initializeApp();
const genericHandler = (object, context) => __awaiter(void 0, void 0, void 0, function* () {
    logs.start();
    logs.metadata(object);
    logs.context(context);
    yield mirror_1.onObjectChange(object, context.eventType);
});
exports.mirrorFinalize = functions.storage
    .object()
    .onFinalize(genericHandler);
exports.mirrorMetadataUpdate = functions.storage
    .object()
    .onMetadataUpdate(genericHandler);
exports.mirrorDelete = functions.storage.object().onDelete(genericHandler);
exports.mirrorArchive = functions.storage
    .object()
    .onArchive(genericHandler);
exports.mirrorObjectPathHttp = functions.handler.https.onRequest((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method != "POST") {
        res.status(403).send("Forbidden!");
        return;
    }
    const path = req.body.path;
    yield mirror_1.mirrorObjectPath(path);
    res.sendStatus(200);
}));
