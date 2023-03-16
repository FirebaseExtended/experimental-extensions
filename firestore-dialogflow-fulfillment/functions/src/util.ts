/*
 * Copyright 2022 Google LLC
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
 * Extract Date and Time from Dialogflow parameters.
 *
 * @param dateParam The string to parse to a date.
 * @param timeParam The string to parse to a time.
 * @returns Date object representing the date and time.
 */
export function extratDate(dateParam: string, timeParam: string) {
  try {
    var date = new Date(dateParam);
    var time = new Date(timeParam);
    var dateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes()
    );

    return dateTime;
  } catch (error) {
    throw new Error("Invalid date or time string.");
  }
}

/**
 * Format Date and Time to a readable string.
 * @param dateTime Date object representing the date and time.
 * @returns Formatted date and time string.
 */
export function getDateTimeFormatted(dateTime: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    weekday: "long",
  }).format(dateTime);
}
