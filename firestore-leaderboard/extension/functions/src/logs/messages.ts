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

export const messages = {
  init: (config = {}) => [
    "Initializing extension with the parameter values",
    config,
  ],
  start: (config = {}) => [
    "Started execution of extension with configuration",
    config,
  ],
  scoreUpdate: () => "Score Entry updated",

  changeCreate: () => "changeCreate",
  changeDelete: () => "changeDelete",
  changeUpdate: () => "changeUpdate",

  complete: () => "onScoreUpdate Complete",
  error: (err: Error) => ["Failed execution of extension", err],
  documentUpdateNoScoreChange: () =>
    `Document was changed but no score update, no processing is required`,

  emptyLeaderboardDocumentEarlyOut: (function_name: string) =>
    `Leaderboard document is empty, early out in function '${function_name}'`,

  updateLeaderboard: (path: string, userId: string) =>
    `Updating Cloud Firestore leaderboard document: '${path}' with userId: '${userId}'`,
  updateLeaderboardComplete: (path: string) =>
    `Finished updating Cloud Firestore leaderboard document: '${path}'`,
  deleteEntryInLeaderboard: (path: string, entry_id: string) =>
    `Delete entry '${entry_id}' in leaderboard document: '${path}'`,
  deleteEntryInLeaderboardComplete: (path: string, entry_id: string) =>
    `Finished delete entry '${entry_id}' in leaderboard document: '${path}'`,

  sameUserLowerScore: (user_id: string, old_score: string, new_score: string) =>
    `User '${user_id}' already has score '${old_score}' higher than new score '${new_score}', no update`,
  comparingLeaderboardSize: (size: number, configSize: number) =>
    `Comparing Leaderboard current size '${size}' with config size '${configSize}'`,

  newEntryScoreLower: (newScore: number, minScore: number) =>
    `New entry's score '${newScore}' is lower than leaderboard's min score '${minScore}', do nothing.`,

  findMinScoreEntryToDelete: (userId: string, minScore: number) =>
    `Find user '${userId}' is the min score '${minScore}' in the leaderboard, should be deleted.`,
};
