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

import { logger } from "firebase-functions";
import { messages } from "./messages";

export const init = (config) => {
  logger.log(...messages.init(config));
};

export const start = (config) => {
  logger.log(...messages.start(config));
};

export const scoreUpdate = () => {
  logger.log(messages.scoreUpdate());
};

export const changeDelete = () => {
  logger.log(messages.changeDelete());
};

export const changeUpdate = () => {
  logger.log(messages.changeUpdate());
};

export const complete = () => {
  logger.log(messages.complete());
};

export const error = (err: Error) => {
  logger.error(...messages.error(err));
};

export const documentUpdateNoScoreChange = () => {
  logger.log(messages.documentUpdateNoScoreChange());
};

export const emptyLeaderboardDocumentEarlyOut = (fuction_name: string) => {
  logger.log(messages.emptyLeaderboardDocumentEarlyOut(fuction_name));
};

export const updateLeaderboard = (path: string, userId: string) => {
  logger.log(messages.updateLeaderboard(path, userId));
};

export const updateLeaderboardComplete = (path: string) => {
  logger.log(messages.updateLeaderboardComplete(path));
};

export const deleteEntryInLeaderboard = (path: string, entry_id: string) => {
  logger.log(messages.deleteEntryInLeaderboard(path, entry_id));
};

export const deleteEntryInLeaderboardComplete = (
  path: string,
  entry_id: string
) => {
  logger.log(messages.deleteEntryInLeaderboardComplete(path, entry_id));
};

export const sameUserLowerScore = (
  user_id: string,
  old_score: string,
  new_score: string
) => {
  logger.log(messages.sameUserLowerScore(user_id, old_score, new_score));
};

export const comparingLeaderboardSize = (size: number, configSize: number) => {
  logger.log(messages.comparingLeaderboardSize(size, configSize));
};
export const newEntryScoreLower = (newScore: number, minScore: number) => {
  logger.log(messages.newEntryScoreLower(newScore, minScore));
};
export const findMinScoreEntryToDelete = (userId: string, minScore: number) => {
  logger.log(messages.findMinScoreEntryToDelete(userId, minScore));
};
