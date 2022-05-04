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

import { LanguageServiceClient, protos } from "@google-cloud/language";

import {
  SentimentAnalysisResult,
  EntityExtractionResult,
  TextClassificationResult,
  NlpTaskSuccessResult,
  NlpTaskErrorResult,
  NlpTaskResult,
  Task,
} from "./models";

interface NlpTaskHandlerConfig {
  entityTypesToSave: Array<string>;
  saveCommonEntities: boolean;
}

/**
 * A handler for all possible NLP tasks.
 */
export class NlpTaskHandler {
  private readonly languageClient = new LanguageServiceClient();

  constructor(private readonly config: NlpTaskHandlerConfig) {}

  async performSentimentAnalysis(input: string): Promise<NlpTaskResult> {
    const document = {
      content: input,
      type: protos.google.cloud.language.v1.Document.Type.PLAIN_TEXT,
    };

    try {
      const [result] = await this.languageClient.analyzeSentiment({ document });
      const sentiment = result.documentSentiment;
      const sentimentData: SentimentAnalysisResult = {
        score: sentiment.score,
        magnitude: sentiment.magnitude,
      };

      const taskSuccessResult: NlpTaskSuccessResult = {
        taskName: Task.SENTIMENT,
        output: sentimentData,
      };

      return taskSuccessResult;
    } catch (err) {
      // wrapping error in NlpTaskResult to not fastfail other tasks
      // caller responsible for dealing with error
      const taskErrorResult: NlpTaskErrorResult = {
        taskName: Task.SENTIMENT,
        error: err,
      };
      return taskErrorResult;
    }
  }

  async performTextClassification(input: string): Promise<NlpTaskResult> {
    const document = {
      content: input,
      type: protos.google.cloud.language.v1.Document.Type.PLAIN_TEXT,
    };

    try {
      const [result] = await this.languageClient.classifyText({ document });
      const categories = result.categories;

      if (!categories) {
        const emptySuccessResult: NlpTaskSuccessResult = {
          taskName: Task.CLASSIFICATION,
          output: [],
        };
        return emptySuccessResult;
      }

      const classificationData: TextClassificationResult = [];

      for (const category of categories) {
        classificationData.push(category.name);
      }

      const taskSuccessResult: NlpTaskSuccessResult = {
        taskName: Task.CLASSIFICATION,
        output: classificationData,
      };

      return taskSuccessResult;
    } catch (err) {
      // wrapping error in NlpTaskResult to not fastfail other tasks
      // caller responsible for dealing with error
      const taskErrorResult: NlpTaskErrorResult = {
        taskName: Task.CLASSIFICATION,
        error: err,
      };
      return taskErrorResult;
    }
  }

  async performEntityExtraction(input: string): Promise<NlpTaskResult> {
    const document = {
      content: input,
      type: protos.google.cloud.language.v1.Document.Type.PLAIN_TEXT,
    };

    try {
      const [result] = await this.languageClient.analyzeEntities({ document });
      const entities = result.entities;

      if (!entities) {
        const emptySuccessResult: NlpTaskSuccessResult = {
          taskName: Task.ENTITY,
          output: {},
        };
        return emptySuccessResult;
      }

      // arrow function needed to access outer scope 'this'
      const entitiesToKeep = entities.filter((entity) =>
        this.shouldKeepEntity(entity)
      );

      const entityExtrationData: EntityExtractionResult = {};

      for (const entity of entitiesToKeep) {
        const stringType: string = this.entityTypeToString(entity.type);

        if (!entityExtrationData[stringType]) {
          entityExtrationData[stringType] = [];
        }

        entityExtrationData[stringType].push(entity.name);
      }

      const taskSuccessResult: NlpTaskSuccessResult = {
        taskName: Task.ENTITY,
        output: entityExtrationData,
      };

      return taskSuccessResult;
    } catch (err) {
      // wrapping error in NlpTaskResult to not fastfail other tasks
      // caller responsible for dealing with error
      const taskErrorResult: NlpTaskErrorResult = {
        taskName: Task.ENTITY,
        error: err,
      };
      return taskErrorResult;
    }
  }

  private shouldKeepEntity(
    entity: protos.google.cloud.language.v1.IEntity
  ): boolean {
    // should not happen, but mention is optinal and nullable.
    if (!entity.mentions) {
      return false;
    }

    if (!this.config.saveCommonEntities) {
      let foundProperMention = entity.mentions.some((mention) =>
        this.isProperMentionType(mention.type)
      );

      if (!foundProperMention) {
        return false;
      }
    }

    const typeStringValue: string = this.entityTypeToString(entity.type);
    if (!this.config.entityTypesToSave.includes(typeStringValue)) {
      return false;
    }

    return true;
  }

  /**
   * Returns string representation of the given entity Type. This method is
   * useful to deal with the edge cases cause by entity.type being a union type.
   *
   * Examples of outputs:
   * entityTypeToString(1); // Returns 'PERSON' as that enum has numeric value '1'
   * entityTypeToString('PERSON'); // Returns 'PERSON' as it's a string
   * entityTypeToString(Type.PERSON); // Returns 'PERSON'
   * entityTypeToString(null); // Returns 'undefined'
   * entityTypeToString('not a type'); // would not compile
   *
   * @param entityType
   */
  private entityTypeToString(
    entityType:
      | protos.google.cloud.language.v1.Entity.Type
      | keyof typeof protos.google.cloud.language.v1.Entity.Type
      | null
  ): string {
    // string check needed in case entityType
    // is (keyof typeof protos.google.cloud.language.v1.Entity.Type)
    if (typeof entityType === "string") {
      return entityType;
    }

    return protos.google.cloud.language.v1.Entity.Type[entityType];
  }

  private isProperMentionType(
    mentionType:
      | protos.google.cloud.language.v1.EntityMention.Type
      | keyof typeof protos.google.cloud.language.v1.EntityMention.Type
      | null
  ): boolean {
    const properTypeEnumValue =
      protos.google.cloud.language.v1.EntityMention.Type.PROPER;

    // string check needed in case mentionType
    // is (keyof typeof protos.google.cloud.language.v1.EntityMention.Type)
    if (typeof mentionType === "string") {
      const properTypeStringValue =
        protos.google.cloud.language.v1.EntityMention.Type[properTypeEnumValue];

      return (
        protos.google.cloud.language.v1.EntityMention.Type[mentionType] ===
        protos.google.cloud.language.v1.EntityMention.Type[
          properTypeStringValue
        ]
      );
    }

    return mentionType === properTypeEnumValue;
  }
}
