import {
	CollectionReference,
	DocumentReference,
} from "firebase-admin/firestore";
import config from "./config";

export function isValidReference(
	reference: DocumentReference | CollectionReference
): boolean {
	return (
		!reference.path.startsWith(config.instanceId) &&
		!config.excludedCollections.some((searchString) =>
			reference.path.includes(searchString)
		)
	);
}
