import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getExtensions } from "firebase-admin/extensions";
import { getFunctions } from "firebase-admin/functions";

import { setupVPCNetwork } from "./vpc";
import { isValidReference } from "./utils";
import { getEmbeddings } from "./embeddings";

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
			// TODO - Create tasks to generate embeddings for all documents in Firestore
			const collections = await admin.firestore().listCollections();
			for (const collection of collections) {
				const docs: string[] = [];
				if (isValidReference(collection))
					// Skip extension-specific collections and user-specified collections.
					continue;

				const documents = await collection.listDocuments();
				for (const document of documents) {
					if (Object.keys(await document.get()).length <= 0) continue;
					docs.push(document.path);
				}

				console.log("Docs to be scheduled", docs.length);

				// Enqueue tasks to generate embeddings for all documents in Firestore.
				await getFunctions().taskQueue("generateEmbeddingsTask").enqueue({
					document: docs,
				});
			}

			// TODO - keep track of the tasks status in Firestore
			// TODO - create an index for the embeddings file
			await runtime.setProcessingState(
				"PROCESSING_COMPLETE",
				"Generatrd embeddings for Firestore and stored the result in Storage, find it in this path:" +
					"bueckt path"
			);
		} catch (error) {
			await runtime.setProcessingState(
				"PROCESSING_FAILED",
				"Failed to generate embeddings, for more details check the logs."
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

export const generateEmbeddingsTask = functions
	.runWith({
		timeoutSeconds: 540,
	})
	.tasks.taskQueue()
	.onDispatch(async (task) => {
		const document = task.document;
		const snap = await admin.firestore().doc(document).get();
		const data = snap.data();

		if (!data) return;

		const fieldsData: string[] = [];
		for (const key in fieldsData) {
			data.push(fieldsData[key]);
		}

		functions.logger.debug("Data to be embedded", { fieldsData });
		const embeddings = await getEmbeddings(fieldsData);
		functions.logger.info("Embeddings generated 🎉", embeddings.length);

		// TODO - store the embeddings in Storage

		// TODO - update the task status in Firestore
	});
