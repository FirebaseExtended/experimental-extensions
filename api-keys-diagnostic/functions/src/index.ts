import * as functions from "firebase-functions";
import { apikeys_v2 } from "googleapis";

exports.apiKeysDiagnostic = functions.pubsub
	.schedule("every 1 minutes")
	.onRun(async (context) => {
		const client = new apikeys_v2.Apikeys({});

		const { data } = await client.projects.locations.keys.list({
			parent: `projects/${functions.config().project.id}`,
		});

		console.log(data);
	});
