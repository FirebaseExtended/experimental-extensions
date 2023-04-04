import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as functionsv2 from "firebase-functions/v2";
import { getExtensions } from "firebase-admin/extensions";

import config from "./config";
import { isValidReference } from "./utils";
import {
	createEmptyBucket,
	createIndex,
	createIndexEndpoint,
	deployIndex,
} from "./vertex_index";

admin.initializeApp();

/**
 * Setup the Matching Engine Index on the first run of the extension.
 */
export const setupMatchingEngine = functions
	.runWith({ memory: "2GB", vpcConnector: config.network })
	.tasks.taskQueue()
	.onDispatch(async (task) => {
		const runtime = getExtensions().runtime();

		try {
			// await createEmptyBucket();
			await createIndex();

			// TODO - Make sure Cloud Audit Logs is enabled for Vertex AI API.
		} catch (error) {
			functions.logger.error(error);
			await runtime.setProcessingState(
				"PROCESSING_FAILED",
				"Failed to generate embeddings, for more details check the logs."
			);
		}
	});

/**
 * Triggered when a new index is created.
 */
export const onIndexCreated = functionsv2.eventarc.onCustomEventPublished(
	"google.cloud.audit.log.v1.written",
	async (event) => {
		const runtime = getExtensions().runtime();
		functionsv2.logger.info("Event recieved", event);

		const res = await createIndexEndpoint();
		functionsv2.logger.info("Index Endpoint created", res);

		await runtime.setProcessingState(
			"PROCESSING_COMPLETE",
			"Successfuly created a Matching Index Endpoint."
		);
	}
);

export const generateEmbeddingsFirestore = functions
	.runWith({ memory: "2GB", timeoutSeconds: 540, vpcConnector: config.network })
	.firestore.document("{document=**}/{documentId}")
	.onCreate(async (snap) => {
		if (!isValidReference(snap.ref)) {
			console.log(`Skipping ${snap.ref.path}`);
			return;
		}
		const data = snap.data();
		functions.logger.debug("Skip document?", Object.keys(data).length);
		if (Object.keys(data).length == 0) return;
		const fieldsData: string[] = [];
		for (const key in data) {
			fieldsData.push(data[key]);
		}
		functions.logger.debug("Data to be embedded", { fieldsData });
		//const embeddings = await getEmbeddings(fieldsData);
		//functions.logger.info("Embeddings generated 🎉", embeddings.length);
	});

// export const generateEmbeddingsTask = functions
// 	.runWith({
// 		memory: "2GB",
// 		timeoutSeconds: 540,
// 		vpcConnector: config.network,
// 	})
// 	.tasks.taskQueue()
// 	.onDispatch(async (task) => {
// 		const document = task.documents;
// 		const snap = await admin.firestore().doc(document).get();
// 		const data = snap.data();

// 		if (!data) return;
// 		functions.logger.debug("Skip document?", Object.keys(data).length);
// 		if (Object.keys(data).length == 0) return;

// 		const fieldsData: string[] = [];
// 		for (const key in data) {
// 			data.push(data[key]);
// 		}

// 		functions.logger.debug("Data to be embedded", { fieldsData });
// 		const embeddings = await getEmbeddings(fieldsData);
// 		functions.logger.info("Embeddings generated 🎉", embeddings.length);

// 		// TODO - store the embeddings in Storage

// 		// TODO - update the task status in Firestore
// 	});
