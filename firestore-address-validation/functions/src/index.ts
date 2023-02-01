import * as functions from "firebase-functions";
import config from "./config";
import axios, { AxiosError } from "axios";

type SupportedRegions =
  | "AU" // Australia
  | "AT" // Austria
  | "BE" // Belgium
  | "BR" // Brazil
  | "CA" // Canada
  | "CL" // Chile
  | "CO" // Colombia
  | "DK" // Denmark
  | "FI" // Finland
  | "FR" // France
  | "DE" // Germany
  | "HU" // Hungary
  | "IE" // Ireland
  | "IT" // Italy
  | "MY" // Malaysia
  | "MX" // Mexico
  | "NL" // Netherlands
  | "NZ" // New Zealand
  | "PL" // Poland
  | "PR" // Puerto Rico
  | "SG" // Singapore
  | "SI" // Slovenia
  | "ES" // Spain
  | "SE" // Sweden
  | "CH" // Switzerland
  | "GB" // United Kingdom
  | "US"; // United States

type Address = {
  addressLines: [string];
  locality?: string;
  // Supported regions: https://developers.google.com/maps/documentation/address-validation/coverage
  regionCode?: SupportedRegions;
};

function addressesEqual(a: Address, b: Address) {
  return (
    JSON.stringify({
      addressLines: a.addressLines,
      locality: a.locality,
      regionCode: a.regionCode,
    }) !==
    JSON.stringify({
      addressLines: b.addressLines,
      locality: b.locality,
      regionCode: b.regionCode,
    })
  );
}

export const validateAddress = functions.firestore
  .document(`${config.collectionId}/{docId}`)
  .onWrite(async (change, _) => {
    const after = change.after.data()?.address as Address;
    const before = change.before.data()?.address as Address;

    const addressChanged = addressesEqual(before, after);

    if (!after || !addressChanged) {
      return;
    }

    const address = after;

    functions.logger.log(
      "Validating address",
      JSON.stringify({ address: address })
    );

    try {
      const response = await axios({
        url: `https://addressvalidation.googleapis.com/v1:validateAddress?key=${config.apiKey}`,
        method: "POST",
        data: { address },
        headers: {
          "Content-Type": "application/json",
        },
      });

      functions.logger.log(response.data);

      const data = response.data;

      if (data) {
        await change.after.ref.set({ addressValidity: data }, { merge: true });
        return;
      }
    } catch (error) {
      functions.logger.error((error as AxiosError).message);
      return;
    }
  });
