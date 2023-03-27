import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getExtensions } from "firebase-admin/extensions";

import { setupVPCNetwork } from "./vpc";
import { getEmbeddings } from "./embeddings";
import { isValidReference } from "./utils";

admin.initializeApp();

export const setupMatchingEngine = functions.tasks
	.taskQueue()
	.onDispatch(async (task) => {
		const runtime = getExtensions().runtime();

		try {
			const response = await setupVPCNetwork();
			functions.logger.info(
				`VPC Network name ${response.network} has been created with connector ${response.name}`
			);
			// TODO - Create a tasks to generate embeddings for all documents in Firestore
			const collections = await admin.firestore().listCollections();
			for (const collection of collections) {
				if (isValidReference(collection))
					// Skip extension-specific collections and user-specified collections.
					continue;

				const documents = await collection.listDocuments();
				for (const document of documents) {
					const task = {
						document: document.path,
					};

					console.log("Task to be dispatched", task);
				}
			}
			// TODO - keep track of the tasks status in Firestore
			// TODO - create an index for the embeddings file
			await runtime.setProcessingState(
				"PROCESSING_COMPLETE",
				"Generating embeddings for " + task.data.document
			);
		} catch (error) {
			await runtime.setProcessingState(
				"PROCESSING_FAILED",
				"Failed to generate embeddings for " + task.data.document
			);
		}
	});

export const generateEmbeddingsFirestore = functions.firestore
	.document("{document=**}")
	.onCreate(async (snap) => {
		if (!isValidReference(snap.ref)) {
			console.log(`Skipping ${snap.ref.path}`);
			return;
		}

		const data = snap.data();

		if (Object.keys(data).length <= 0) return;

		const fieldsData: string[] = [];
		for (const key in fieldsData) {
			data.push(fieldsData[key]);
		}

		functions.logger.debug("Data to be embedded", { fieldsData });
		const embeddings = await getEmbeddings(fieldsData);
		functions.logger.info("Embeddings generated 🎉", embeddings.length);
	});
