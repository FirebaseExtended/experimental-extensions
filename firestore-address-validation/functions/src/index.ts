import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { getFunctions } from "firebase-admin/functions";

import axios, { AxiosError } from "axios";

import { addressesChanged, checkDataValidity } from "./utils";
import config from "./config";

admin.initializeApp();

/**
 * Validates an address using the Google Maps Address Validation API.
 *
 * A valid address will return a status of OK and a list of address components.
 * A non-valid address will return a error status and a message.
 *
 * Possible error status codes:
 *  - `403 PERMISSION_DENIED`: The request is missing a valid API key.
 *  - `400 INVALID_ARGUMENT`: Address lines missing from request.
 *
 * @see https://developers.google.com/maps/documentation/address-validation/requests-validate-address
 *
 * @param {Address} address The address to validate.
 */
async function validateAddress(address: Address) {
  return axios({
    url: `https://addressvalidation.googleapis.com/v1:validateAddress?key=`,
    method: "POST",
    data: { address: address },
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function enqueueTask(address: Address, docId: string) {
  // Retry the request if it fails.
  const queue = getFunctions().taskQueue(
    `ext-${process.env.EXT_INSTANCE_ID}-backoff`
  );
  await queue.enqueue(
    {
      address: address,
      docId: docId,
    },
    // Retry the request after 60 seconds.
    { scheduleDelaySeconds: 60 }
  );
}

export const retryOnUnknownError = functions
  .runWith({ secrets: [`ext-${process.env.EXT_INSTANCE_ID}-API_KEY`] })
  .tasks.taskQueue({
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 60,
      maxDoublings: 6,
    },
    rateLimits: {
      maxConcurrentDispatches: 6,
    },
  })
  .onDispatch(async (data, context) => {
    const address = data.address as Address;
    const docId = data.docId as string;

    try {
      const data = await validateAddress(address);
      if (data) {
        // Merge the address validity data with the address document.
        await admin
          .firestore()
          .collection(config.collectionId)
          .doc(docId)
          .update({
            addressValidity: data,
            error: admin.firestore.FieldValue.delete(),
          });

        return;
      }
    } catch (error) {
      functions.logger.error((error as AxiosError).response?.data);
      throw error;
    }
  });

/**
 * Validates an address written to a Firestore collection
 * using the Google Maps Address Validation API.
 */
export const validateAddressTrigger = functions.firestore
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
      const data = await validateAddress(afterAddress);
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
      if ((error as AxiosError).code === "UNKNOWN") {
        await enqueueTask(afterAddress, change.after.id);
        return;
      } else {
        functions.logger.error((error as AxiosError).response?.data);
        // Write the error back to the document.
        await change.after.ref.set(
          { error: (error as AxiosError).response?.data },
          { merge: true }
        );
      }
      return;
    }
  });
