/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as functions from "firebase-functions";
import axios from "axios";
import config from "./config";

export const autocomplete = functions.firestore
  .document(`${config.collectionId}/{documentId}`)
  .onWrite(async (snapshot) => {
    const data = snapshot.after?.data();

    if (!data) return;

    if (snapshot.after.isEqual(snapshot.before)) return;

    const { input } = data;

    if (!input) return;

    try {
      const res = await axios({
        method: "get",
        url: `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        headers: {},
        params: {
          input: input,
          types: "geocode",
          key: config.apiKey,
        },
      });

      if (res.data.status !== "OK") {
        const {
          status,
          error_message,
        }: {
          status: string;
          error_message: string;
        } = res.data;
        functions.logger.error(status, error_message);

        await snapshot.after.ref.update({
          ext_PlacesAutocomplete: {
            status,
            error_message,
          },
        });

        return;
      }

      const predictions = res.data.predictions;

      await snapshot.after.ref.update({
        ext_PlacesAutocomplete: { predictions: predictions },
      });
    } catch (err) {
      functions.logger.error(err);
      await snapshot.after.ref.update({
        "ext_PlacesAutocomplete.error":
          err ?? "Something wrong happened, check your Cloud logs.",
      });
    }
  });
