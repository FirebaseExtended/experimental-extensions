import {
	IndexServiceClient,
	IndexEndpointServiceClient,
} from "@google-cloud/aiplatform";
import config from "./config";

const indexClient = new IndexServiceClient({
	apiEndpoint: `${config.location}-aiplatform.googleapis.com`,
	fallback: "rest",
});
const indexEndpointClient = new IndexEndpointServiceClient();

export async function createIndex() {
	const res = await indexClient.createIndex({
		parent: `projects/${config.projectId}/locations/${config.location}`,
		index: {
			name: "ext-" + config.instanceId,
			displayName: "Firestore Text Similarity Extension",
			indexUpdateMethod: "STREAM_UPDATE",
			metadataSchemaUri:
				"gs://google-cloud-aiplatform/schema/metadata/index/1.0.0/index_metadata.yaml",
			metadata: {
				structValue: {
					fields: {
						contentsDeltaUri: {
							stringValue: "gs://your-bucket/path/to/contents-delta",
						},
						isCompleteOverwrite: { boolValue: false },
						config: {
							structValue: {
								fields: {
									dimensions: { numberValue: 128 },
									algorithmConfig: {
										structValue: {
											fields: {
												type: { stringValue: "bruteForceConfig" },
											},
										},
										// structValue: {
										// 	fields: {
										// 		type: { stringValue: "treeAhConfig" },
										// 		treeAhConfig: {
										// 			structValue: {
										// 				fields: {
										// 					type: { stringValue: "treeAhConfig" },
										// 					leafNodeEmbeddingCount: { numberValue: 1000 },
										// 					leafNodesToSearchPercent: { numberValue: 10 },
										// 				},
										// 			},
										// 		},
										// 	},
										//},
									},
									// approximateNeighborsCount: { numberValue: 100 },
									// distanceMeasureType: {
									// 	stringValue: "DOT_PRODUCT_DISTANCE",
									// },
									// featureNormType: { stringValue: "NONE" },
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
