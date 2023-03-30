import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getExtensions } from "firebase-admin/extensions";

import { isValidReference } from "./utils";
import { getEmbeddings } from "./embeddings";
import { createIndex, createIndexEndpoint, deployIndex } from "./vertex_index";

import config from "./config";

admin.initializeApp();

export const setupMatchingEngine = functions
	.runWith({ memory: "2GB", vpcConnector: config.network })
	.tasks.taskQueue()
	.onDispatch(async (task) => {
		const runtime = getExtensions().runtime();

		try {
			const index = await createIndex();
			const indexEndpoint = await createIndexEndpoint();
			functions.logger.info(`Index Endpoint ${indexEndpoint} has been created`);

			await deployIndex(indexEndpoint.name!, index.name!);

			// TODO - keep track of the tasks status in Firestore
			// TODO - create an index for the embeddings file
			await runtime.setProcessingState(
				"PROCESSING_COMPLETE",
				"The matching engine has been successfully set up."
			);
		} catch (error) {
			functions.logger.error(error);
			await runtime.setProcessingState(
				"PROCESSING_FAILED",
				"Failed to generate embeddings, for more details check the logs."
			);
		}
	});

export const generateEmbeddingsFirestore = functions
	.runWith({ memory: "2GB", timeoutSeconds: 540, vpcConnector: config.network })
	.firestore.document("{document=**}/{documentId}")
	.onCreate(async (snap) => {
		const index = await createIndex();
		// if (!isValidReference(snap.ref)) {
		// 	console.log(`Skipping ${snap.ref.path}`);
		// 	return;
		// }

		// const data = snap.data();

		// functions.logger.debug("Skip document?", Object.keys(data).length);

		// if (Object.keys(data).length == 0) return;

		// const fieldsData: string[] = [];
		// for (const key in data) {
		// 	fieldsData.push(data[key]);
		// }

		// functions.logger.debug("Data to be embedded", { fieldsData });
		// const embeddings = await getEmbeddings(fieldsData);
		// functions.logger.info("Embeddings generated 🎉", embeddings.length);
	});

export const generateEmbeddingsTask = functions
	.runWith({
		memory: "2GB",
		timeoutSeconds: 540,
		vpcConnector: config.network,
	})
	.tasks.taskQueue()
	.onDispatch(async (task) => {
		const document = task.documents;
		const snap = await admin.firestore().doc(document).get();
		const data = snap.data();

		if (!data) return;
		functions.logger.debug("Skip document?", Object.keys(data).length);
		if (Object.keys(data).length == 0) return;

		const fieldsData: string[] = [];
		for (const key in data) {
			data.push(data[key]);
		}

		functions.logger.debug("Data to be embedded", { fieldsData });
		const embeddings = await getEmbeddings(fieldsData);
		functions.logger.info("Embeddings generated 🎉", embeddings.length);

		// TODO - store the embeddings in Storage

		// TODO - update the task status in Firestore
	});
