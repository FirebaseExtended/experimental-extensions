/*
 * Copyright 2020 Google LLC
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

export function complete() {
  console.log("Completed execution of extension");
}

export function documentCreatedNoInput() {
  console.log(
    "Document was created without an input string, " +
      "no processing is required"
  );
}

export function documentCreatedWithInput() {
  console.log("Document was created with an input string");
}

export function updateDocument(path: string) {
  console.log(`Updating Cloud Firestore document: '${path}'`);
}

export function updateDocumentComplete(path: string) {
  console.log(`Finished updating Cloud Firestore document: '${path}'`);
}

export function unknownNLPTaskFound(taskName: string) {
  console.log(
    `Found an unknow NLP task '${taskName}'. ` +
      "Might be a problem with extension's configuration"
  );
}

export function nlpTaskError(taskName: string, err: Error) {
  console.error(`Error occured while performing task '${taskName}'`, err);
}

export function documentUpdatedUnchangedInput() {
  console.log(
    "Document was updated, input string has not changed, no processing is required"
  );
}

export function documentUpdatedChangedInput() {
  console.log("Document was updated, input string has changed");
}

export function documentUpdatedDeletedInput() {
  console.log("Document was updated, input string was deleted");
}

export function documentUpdatedNoInput() {
  console.log(
    "Document was updated, no input string exists, no processing is required"
  );
}

export function fieldNamesNotDifferent() {
  console.error(
    "The 'Input' and 'Output' field names must be different for " +
      "this extension to function correctly"
  );
}

export function inputFieldIsSubfieldOfOutputField() {
  console.error(
    "The 'Input' field name must not be a subfield of 'Output' " +
      "for this extension to function correctly"
  );
}
