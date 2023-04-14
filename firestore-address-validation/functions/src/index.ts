import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { getFunctions } from "firebase-admin/functions";

import axios, { AxiosError } from "axios";

import { addressesChanged, checkDataValidity } from "./utils";
import config from "./config";
import { Address } from "./types";

admin.initializeApp();

enum Status {
  PROCESSING = "PROCESSING",
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
}

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
    url: `https://addressvalidation.googleapis.com/v1:validateAddress?key=${config.apiKey}`,
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
    `ext-${process.env.EXT_INSTANCE_ID}-retryOnUnknownError`
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
  .onDispatch(async (data) => {
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
            status: Status.SUCCESS,
            error: admin.firestore.FieldValue.delete(),
          });

        return;
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response) {
          functions.logger.error(error.response.data);
        } else {
          functions.logger.error(error.response);
        }
      } else {
        functions.logger.error(error);
      }

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
    if (!addressesChanged(afterAddress, beforeAddress)) {
      return;
    }

    functions.logger.info("Validating address started", afterAddress);

    try {
      const res = await validateAddress(afterAddress);
      if (res) {
        // Merge the address validity data with the address document.
        await change.after.ref.update({
          addressValidity: res.data,
          ...(change.after.data()?.error && {
            error: admin.firestore.FieldValue.delete(),
            status: Status.SUCCESS,
          }),
        });
        return;
      }
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.response) {
          const error = (e as AxiosError).response?.data as {
            error?: { message: string; code: number; status: string };
          };

          functions.logger.error(error);

          if (error.error?.status === "UNKNOWN") {
            // ../firestore-address-validation
            // Write the status back to the document.
            await change.after.ref.update({
              status: Status.PROCESSING,
            });
            await enqueueTask(afterAddress, change.after.id);
            return;
          }

          // Write the error back to the document.
          await change.after.ref.update({
            error: error?.error,
            status: Status.FAILURE,
          });
        } else {
          functions.logger.error(e.response);
        }
      } else {
        const err = e as Error;
        functions.logger.error(err);
        await change.after.ref.update({
          error: { message: err.message },
          status: Status.FAILURE,
        });
      }
    }
    return;
  });
