export default {
	projectId: process.env.PROJECT_ID!,
	location: process.env.LOCATION!,
	instanceId: process.env.EXT_INSTANCE_ID!,
	collectionName: process.env.COLLECTION_NAME!,
	fields: Array.from(process.env.FIELDS?.split(",") ?? []),
	network: process.env.NETWORK!,
};
