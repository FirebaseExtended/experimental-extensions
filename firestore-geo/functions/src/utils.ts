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
import { firestore } from "firebase-admin";

export function validateAddress(
  after: firestore.DocumentSnapshot | undefined,
  before: firestore.DocumentSnapshot | undefined
): boolean {
  // If the document was deleted, terminate.
  if (!after?.data() || !after.exists) {
    return false;
  }

  const address = after.data()?.address;

  if (!address) {
    return false;
  }

  if (before?.data()?.address === address) {
    return false;
  }

  if (typeof address !== "string") {
    functions.logger.error("Type of address must be a string");
    return false;
  }

  return true;
}

export function validateOriginAndDestination(
  after: firestore.DocumentSnapshot | undefined,
  before: firestore.DocumentSnapshot | undefined
): boolean {
  // If the document was deleted, terminate.
  if (!after?.data() || !after.exists) {
    return false;
  }

  const destination = after.data()?.destination;
  const origin = after.data()?.origin;

  if (!destination || !origin) {
    return false;
  }

  if (before?.data()?.destination === destination && before?.data()?.origin === origin) {
    return false;
  }

  if (typeof destination !== "string" || typeof origin !== "string") {
    functions.logger.error("Type of origin and destination must be a string");
    return false;
  }

  return true;
}
