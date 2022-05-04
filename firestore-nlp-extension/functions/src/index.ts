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

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import * as logs from "./logs";
import config from "./config";
import * as validators from "./validators";

import {
  NlpData,
  NlpTaskSuccessResult,
  NlpTaskErrorResult,
  NlpTaskResult,
  Task,
} from "./models";
import { NlpTaskHandler } from "./nlpTaskHandler";

const nlpTaskHandler = new NlpTaskHandler({
  entityTypesToSave: config.entityTypesToSave,
  saveCommonEntities: config.saveCommonEntities,
});

admin.initializeApp();

export const firestoreNlpDocCreate =
  functions.handler.firestore.document.onCreate(
    async (docSnapshot): Promise<void> => {
      if (!isConfigValid()) {
        return;
      }

      await handleDocumentCreate(docSnapshot);

      logs.complete();
    }
  );

export const firestoreNlpDocUpdate =
  functions.handler.firestore.document.onUpdate(
    async (change): Promise<void> => {
      if (!isConfigValid()) {
        return;
      }

      await handleUpdateDocument(change.before, change.after);

      logs.complete();
    }
  );

function isConfigValid(): boolean {
  // needed to stop circular calls
  if (config.inputFieldName === config.outputFieldName) {
    logs.fieldNamesNotDifferent();
    return false;
  }

  // needed to avoid possible circular calls
  if (
    validators.isInputFieldSubfieldOfOutputField(
      config.inputFieldName,
      config.outputFieldName
    )
  ) {
    logs.inputFieldIsSubfieldOfOutputField();
    return false;
  }

  return true;
}

function extractInput(snapshot: admin.firestore.DocumentSnapshot): string {
  return snapshot.get(config.inputFieldName);
}

async function handleUpdateDocument(
  beforeDocSnapshot: admin.firestore.DocumentSnapshot,
  afterDocSnapshot: admin.firestore.DocumentSnapshot
): Promise<void> {
  const inputBefore = extractInput(beforeDocSnapshot);
  const inputAfter = extractInput(afterDocSnapshot);

  if (!inputAfter && !inputBefore) {
    logs.documentUpdatedNoInput();
    return;
  }

  if (inputBefore === inputAfter) {
    logs.documentUpdatedUnchangedInput();
    return;
  }

  if (inputAfter) {
    logs.documentUpdatedChangedInput();
    await updateNlpData(afterDocSnapshot);
  } else if (inputBefore) {
    logs.documentUpdatedDeletedInput();
    await updateDocumentNlpData(
      afterDocSnapshot.ref,
      admin.firestore.FieldValue.delete()
    );
  }
}

async function handleDocumentCreate(
  docSnapshot: admin.firestore.DocumentSnapshot
): Promise<void> {
  const input = extractInput(docSnapshot);

  if (!input) {
    logs.documentCreatedNoInput();
    return;
  }

  logs.documentCreatedWithInput();

  await updateNlpData(docSnapshot);
}

async function updateNlpData(
  docSnapshot: admin.firestore.DocumentSnapshot
): Promise<void> {
  const input = extractInput(docSnapshot);

  const nlpTasks: Array<Promise<NlpTaskResult>> = config.tasks.map((task) =>
    performNLPTask(task, input)
  );

  const nlpTasksResults = await Promise.all(nlpTasks);

  const nlpData: NlpData = {};

  for (const result of nlpTasksResults) {
    if (isNlpTaskSuccessResult(result)) {
      nlpData[result.taskName] = result.output;
    } else {
      logs.nlpTaskError(result.taskName, result.error);
    }
  }

  await updateDocumentNlpData(docSnapshot.ref, nlpData);
}

async function performNLPTask(
  taskName: string,
  input: string
): Promise<NlpTaskResult> {
  switch (taskName) {
    case Task.SENTIMENT:
      return nlpTaskHandler.performSentimentAnalysis(input);
    case Task.ENTITY:
      return nlpTaskHandler.performEntityExtraction(input);
    case Task.CLASSIFICATION:
      return nlpTaskHandler.performTextClassification(input);
    default:
      logs.unknownNLPTaskFound(taskName);

      // wrapping error in NlpTaskResult to not fastfail other tasks
      const taskErrorResult: NlpTaskErrorResult = {
        taskName: Task.SENTIMENT,
        error: new Error(
          `Cannot perform NLP task named '${taskName}' as it's unknown.`
        ),
      };

      return taskErrorResult;
  }
}

function isNlpTaskSuccessResult(
  result: NlpTaskResult
): result is NlpTaskSuccessResult {
  return (result as NlpTaskSuccessResult).output != undefined;
}

async function updateDocumentNlpData(
  docReference: admin.firestore.DocumentReference,
  nlpData: NlpData | admin.firestore.FieldValue
): Promise<void> {
  logs.updateDocument(docReference.path);

  // Wrapping in transaction to allow for automatic retries
  await admin.firestore().runTransaction(async (transaction) => {
    transaction.update(docReference, config.outputFieldName, nlpData);
  });

  logs.updateDocumentComplete(docReference.path);
}
