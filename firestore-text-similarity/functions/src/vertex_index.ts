import {
	IndexServiceClient,
	IndexEndpointServiceClient,
} from "@google-cloud/aiplatform";
import config from "./config";

import * as admin from "firebase-admin";

const indexClient = new IndexServiceClient({
	apiEndpoint: `${config.location}-aiplatform.googleapis.com`,
	fallback: "rest",
});
const indexEndpointClient = new IndexEndpointServiceClient();

/**
 * Creates a new bucket & an empty file in it.
 *
 * This is a workaround for the fact that the Matching Engine API requires a bucket
 * with a file in it.
 *
 * @returns {Promise<void>}
 */
export async function createEmptyBucket() {
	await admin
		.storage()
		.bucket(config.instanceId)
		.file("data/empty.json")
		.save("", {});
}

export async function createIndex() {
	const res = await indexClient.createIndex({
		parent: `projects/${config.projectId}/locations/${config.location}`,
		index: {
			name: "ext-" + config.instanceId,
			displayName: "Firestore Text Similarity Extension",
			indexUpdateMethod: "STREAM_UPDATE",
			metadataSchemaUri:
				"gs://google-cloud-aiplatform/schema/matchingengine/metadata/nearest_neighbor_search_1.0.0.yaml",
			metadata: {
				structValue: {
					fields: {
						contentsDeltaUri: {
							stringValue: `gs://${config.instanceId}/data/empty.json`,
						},
						isCompleteOverwrite: { boolValue: false },
						config: {
							structValue: {
								fields: {
									dimensions: { numberValue: 128 },
									distanceMeasureType: { stringValue: "DOT_PRODUCT_DISTANCE" },
									featureNormType: { stringValue: "NONE" },
									algorithmConfig: {
										structValue: {
											fields: {
												bruteForceConfig: {
													structValue: {
														fields: {},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	});

	return res[0];
}

export async function createIndexEndpoint() {
	const res = await indexEndpointClient.createIndexEndpoint({
		parent: `projects/${config.projectId}/locations/${config.location}`,
		indexEndpoint: {
			name: "ext-" + config.instanceId,
			displayName: "Firestore Text Similarity Extension",
			network: `projects/${config.projectId}/locations/${config.location}/networks/${config.network}`,
			deployedIndexes: [
				{
					index: `projects/${config.projectId}/locations/${config.location}/indexes/ext-${config.instanceId}`,
				},
			],
		},
	});

	return res[0];
}

export async function deployIndex(
	indexEndpoint: string,
	indexResourceName: string
) {
	const deployedIndex = {
		id: "your-custom-deployed-index-id",
		index: indexResourceName,
		displayName: "My Deployed Matching Engine Index",
	};

	const request = {
		indexEndpoint: indexEndpoint,
		deployedIndex: deployedIndex,
	};

	try {
		const [operation] = await indexEndpointClient.deployIndex(request);
		console.log("Deploying index. This might take a few minutes...");
		const [response] = await operation.promise();
		console.log(`Index deployed: ${response.deployedIndex?.displayName}`);
	} catch (error) {
		console.error("Error deploying index:", error);
	}
}
