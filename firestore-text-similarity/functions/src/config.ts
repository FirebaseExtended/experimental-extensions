export default {
	projectId: process.env.PROJECT_ID!,
	location: process.env.LOCATION!,
	instanceId: process.env.EXT_INSTANCE_ID!,
	excludedCollections: Array.from(
		process.env.EXCLUDED_COLLECTIONS?.split(",") ?? []
	),
};
