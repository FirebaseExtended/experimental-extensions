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

/**
 * Checks if the input field is a subfield of the output field.
 * This could cause input to be overwritten in best case and cause
 * circular function triggers at the worst.
 *
 * Examples of outputs:
 * isInputFieldSubfieldOfOutputField("text.nlp", "text"); // Returns true
 * isInputFieldSubfieldOfOutputField("text", "textNLP"); // Returns false
 * isInputFieldSubfieldOfOutputField("text", "text"); // Returns false
 *
 * @param inputFieldName
 * @param outputFieldName
 */
export function isInputFieldSubfieldOfOutputField(
  inputFieldName: string,
  outputFieldName: string
): boolean {
  return inputFieldName.startsWith(`${outputFieldName}.`);
}
