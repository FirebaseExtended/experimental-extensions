import { firestore } from "firebase-admin";
import * as functions from "firebase-functions";
import { Address } from "./types";

export function addressesChanged(a: Address, b?: Address) {
  return (
    JSON.stringify({
      addressLines: a.addressLines,
      locality: a.locality,
      regionCode: a.regionCode,
    }) !==
    JSON.stringify({
      addressLines: b?.addressLines,
      locality: b?.locality,
      regionCode: b?.regionCode,
    })
  );
}

export async function checkDataValidity(
  after: firestore.DocumentSnapshot | undefined
) {
  // If the document was deleted, terminate.
  if (!after || !after.exists) {
    return false;
  }

  if (after.data()?.address || after.data()?.address == "") {
    const address = after.data()?.address;

    if (!address.hasOwnProperty("addressLines")) {
      functions.logger.error(Errors.MissingRequiredField);

      // Write the error back to the document.
      await after.ref.set(
        { error: Errors.MissingRequiredField },
        { merge: true }
      );

      // Don't proceed.
      return false;
    } else {
      // If the address has an addressLines field, make sure it's an array.
      if (
        !Array.isArray(address.addressLines) ||
        address.addressLines.length < 1
      ) {
        functions.logger.error(Errors.MissingRequiredField);

        // Write the error back to the document.
        await after.ref.set(
          { error: Errors.MissingRequiredField },
          { merge: true }
        );

        // Don't proceed.
        return false;
      }
    }
  } else {
    // Don't proceed.
    return false;
  }
  // If the above lines don't throw an error, the data is valid.
  return true;
}

enum Errors {
  MissingRequiredField = 'Missing required field "addressLines", please make sure that your "address" field is a map and it contains an "addressLines" array field.',
  UnknownError = "Unknown Error",
}
