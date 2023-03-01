import * as functions from "firebase-functions";
import { DlpServiceClient } from "@google-cloud/dlp";

import {
	MaskTransformation,
	RedactTransformation,
	ReplaceTransformation,
	ReplaceWithInfoTypeTransformation,
	rowsToTable,
	tableToReplies,
} from "./transofmrations";

/**
 * Deidentify sensitive data in a string with [the Data Loss Prevention API](https://cloud.google.com/architecture/de-identification-re-identification-pii-using-cloud-dlp)
 * using `infoTypeTransformations` method.
 *
 * Read more about this method: https://cloud.google.com/dlp/docs/deidentify-sensitive-data#infotype_transformations
 *
 * @param {Array} rows The text to deidentify.
 *
 * @returns {Promise<Record<string, any>>} The deidentified record.
 */
export async function deidentifyWithInfoTypeTransformations(
	rows: [],
	client: DlpServiceClient,
	transformation:
		| MaskTransformation
		| RedactTransformation
		| ReplaceTransformation
		| ReplaceWithInfoTypeTransformation
): Promise<Record<string, any>> {
	const deidentifiedItems = [];

	for (const row of rows) {
		const data = row[0] as Record<string, any>;

		for (const key in data) {
			if (data.hasOwnProperty(key)) {
				const element = data[key];
				const request = {
					...transformation.deidentifyConfig,
					item: { value: element },
				};

				const [response] = await client.deidentifyContent(request);
				data[key] = response.item?.value;
			}
		}

		deidentifiedItems.push(data);
	}

	return deidentifiedItems;
}

/**
 * Deidentify sensitive data in a string with the [Data Loss Prevention API](https://cloud.google.com/architecture/de-identification-re-identification-pii-using-cloud-dlp)
 * using `recordTransformations` method.
 *
 * Read more about this method: https://cloud.google.com/dlp/docs/deidentify-sensitive-data#record_transformations
 *
 * @param {Array} rows The rows with data to deidentify.
 *
 * @returns {Promise<string>} The deidentified text.
 */
export async function deidentifyWithRecordTransformations(
	rows: [],
	client: DlpServiceClient,
	transformation:
		| MaskTransformation
		| RedactTransformation
		| ReplaceTransformation
		| ReplaceWithInfoTypeTransformation
) {
	let table;

	try {
		// Convert raw rows to Table type
		table = rowsToTable(rows);
	} catch (error) {
		functions.logger.debug(`Error converting rows to Table type.`);
		throw error;
	}

	// Construct de-identification request
	const request = {
		...transformation.deidentifyConfig,
		item: {
			table: table,
		},
	};

	// Run deidentification request
	const [response] = await client.deidentifyContent(request);

	functions.logger.debug(tableToReplies(response.item?.table));

	return tableToReplies(response.item?.table);
}
