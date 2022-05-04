/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as functionsTestInit from "firebase-functions-test";

/**
 * Creates a documentSnapshot using firebase-functions-test with
 * default data or provided input and path.
 * @param input
 * @param path
 */
export function createDocumentSnapshot(
  input: any = { input: "I like Paris. I like the Louvre." },
  path = "trips/id1"
) {
  const functionsTest = functionsTestInit();
  return functionsTest.firestore.makeDocumentSnapshot(input, path);
}
