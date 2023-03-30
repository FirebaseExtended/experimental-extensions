import { VpcAccessServiceClient } from "@google-cloud/vpc-access";
import { google } from "googleapis";

import config from "./config";

const compute = google.compute("v1");
const auth = new google.auth.GoogleAuth({
	scopes: [
		"https://www.googleapis.com/auth/cloud-platform",
		"https://www.googleapis.com/auth/compute",
	],
});
const vpcaccessClient = new VpcAccessServiceClient({ auth: auth });

/**
 * Creates a VPC network & connector for the project.
 */
export async function setupVPCNetwork() {
	const network = config.network;

	await compute.networks.insert({
		auth: await auth.getClient(),
		project: config.projectId,
		requestBody: {
			name: network,
			autoCreateSubnetworks: true,
		},
	});
	const [operation] = await vpcaccessClient.createConnector({
		parent: `projects/${config.projectId}/locations/${config.location}`,
		connectorId: `ext-connector`,
		connector: {
			connectedProjects: [config.projectId],
			network: network,
			ipCidrRange: "10.8.0.0/28",
			maxInstances: 3,
			minInstances: 2,
		},
	});
	const [response] = await operation.promise();

	return response;
}
