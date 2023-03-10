import * as functions from "firebase-functions";
import { apikeys_v2 } from "googleapis";
import * as admin from "firebase-admin";

admin.initializeApp();

export const apiKeysDiagnostic = functions.pubsub
	.schedule("every 2 minutes")
	.onRun(async (context) => {
		console.log("hi");

		// const client = new apikeys_v2.Apikeys({});

		// const { data } = await client.projects.locations.keys.list({
		// 	parent: `projects/${functions.config().project.id}`,
		// });

		// console.log(data);
	});
