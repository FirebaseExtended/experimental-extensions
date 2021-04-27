export abstract class Constants {
  // Extension Firestore Document Fields
  static readonly lastEventField = "lastEvent";
  static readonly childRefField = "childRef";
  static readonly gcsMetadataField = "gcsMetadata";
  // GCS Object Metadata Fields
  static readonly objectCustomMetadataField = "metadata";
  // Extension Constants
  static readonly queryLimit = 5;
  static readonly transactionAttempts = 5;
  static readonly numberFields = ["size", "generation", "metageneration"];
  static readonly dateFields = [
    "timeCreated",
    "timeStorageClassUpdated",
    "updated",
  ];
}
