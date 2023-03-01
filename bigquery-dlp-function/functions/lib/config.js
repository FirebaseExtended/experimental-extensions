"use strict";
/*
 * Copyright 2019 Google LLC
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    projectId: process.env.PROJECT_ID,
    extInstanceId: process.env.EXT_INSTANCE_ID,
    datasetId: process.env.DATASET_ID,
    location: process.env.LOCATION,
    method: process.env.TRANSFORMATION_METHOD,
    technique: process.env.TRANSFORMATION_TECHNIQUE,
    fields: (_a = process.env.FIELDS_TO_TRANSFORM) === null || _a === void 0 ? void 0 : _a.split(","),
};
//# sourceMappingURL=config.js.map