import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import config from "./config";
import axios, { AxiosError } from "axios";
import { addressesChanged, checkDataValidity } from "./utils";

admin.initializeApp();

/**
 * Validates an address written to a Firestore collection
 * using the Google Maps Address Validation API.
 */
export const validateAddress = functions.firestore
  .document(`${config.collectionId}/{docId}`)
  .onWrite(async (change, _) => {
    const dataIsValid = await checkDataValidity(change.after);

    if (!dataIsValid) {
      return;
    }

    const after = change.after.data();
    const before = change.before.data();

    const afterAddress = after?.address as Address;
    const beforeAddress = before?.address as Address;

    // Checking if the address has changed,
    // terminate if address did not.
    if (!addressesChanged(beforeAddress, afterAddress)) {
      return;
    }

    functions.logger.info("Validating address started", afterAddress);

    try {
      const response = await axios({
        url: `https://addressvalidation.googleapis.com/v1:validateAddress?key=${config.apiKey}`,
        method: "POST",
        data: { address: afterAddress },
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = response.data;

      if (data) {
        // Merge the address validity data with the address document.
        await change.after.ref.set(
          {
            addressValidity: data,
            ...(change.after.data()?.error && {
              error: admin.firestore.FieldValue.delete(),
            }),
          },
          { merge: true }
        );
        return;
      }
    } catch (error) {
      functions.logger.error((error as AxiosError).response?.data);
      // Write the error back to the document.
      await change.after.ref.set(
        { error: (error as AxiosError).message },
        { merge: true }
      );
      return;
    }
  });
