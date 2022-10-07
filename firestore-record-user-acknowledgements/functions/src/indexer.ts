import * as protobuf from "protobufjs";
import * as functions from "firebase-functions";
import config from "./config";

// Query Scope defines the scope at which a query is run.
enum QueryScope {
  // Indexes with a collection query scope specified allow queries
  // against a collection that is the child of a specific document, specified
  // at query time, and that has the collection id specified by the index.
  COLLECTION = 1,

  // Indexes with a collection group query scope specified allow queries
  // against all collections that has the collection id specified by the
  // index.
  COLLECTION_GROUP = 2,
}

// The supported orderings.
enum QueryOrder {
  // The field is ordered by ascending field value.
  ASCENDING = 1,

  // The field is ordered by descending field value.
  DESCENDING = 2,
}

interface IndexFieldOptions {
  fieldPath: string;
  order: QueryOrder;
}

interface IndexOptions {
  queryScope: QueryScope;
  fields: IndexFieldOptions[];
}

// Sourced from: https://github.com/googleapis/googleapis/blob/master/google/firestore/admin/v1/index.proto
const _indexProto = `
syntax = "proto3";
// Query Scope defines the scope at which a query is run. This is specified on
// a StructuredQuery's \`from\` field.
enum QueryScope {
  // The query scope is unspecified. Not a valid option.
  QUERY_SCOPE_UNSPECIFIED = 0;
  // Indexes with a collection query scope specified allow queries
  // against a collection that is the child of a specific document, specified
  // at query time, and that has the collection id specified by the index.
  COLLECTION = 1;
  // Indexes with a collection group query scope specified allow queries
  // against all collections that has the collection id specified by the
  // index.
  COLLECTION_GROUP = 2;
}
// A field in an index.
// The field_path describes which field is indexed, the value_mode describes
// how the field value is indexed.
message IndexField {
  // The supported orderings.
  enum Order {
    // The ordering is unspecified. Not a valid option.
    ORDER_UNSPECIFIED = 0;
    // The field is ordered by ascending field value.
    ASCENDING = 1;
    // The field is ordered by descending field value.
    DESCENDING = 2;
  }
  // The supported array value configurations.
  enum ArrayConfig {
    // The index does not support additional array queries.
    ARRAY_CONFIG_UNSPECIFIED = 0;
    // The index supports array containment queries.
    CONTAINS = 1;
  }
  // Can be __name__.
  // For single field indexes, this must match the name of the field or may
  // be omitted.
  string field_path = 1;
  // How the field value is indexed.
  oneof value_mode {
    // Indicates that this field supports ordering by the specified order or
    // comparing using =, !=, <, <=, >, >=.
    Order order = 2;
    // Indicates that this field supports operations on \`array_value\`s.
    ArrayConfig array_config = 3;
  }
}
message Index {
  // Output only. A server defined name for this index.
  // The form of this name for composite indexes will be:
  // \`projects/{project_id}/databases/{database_id}/collectionGroups/{collection_id}/indexes/{composite_index_id}\`
  // For single field indexes, this field will be empty.
  string name = 1;
  // Indexes with a collection query scope specified allow queries
  // against a collection that is the child of a specific document, specified at
  // query time, and that has the same collection id.
  //
  // Indexes with a collection group query scope specified allow queries against
  // all collections descended from a specific document, specified at query
  // time, and that have the same collection id as this index.
  QueryScope query_scope = 2;
  // The fields supported by this index.
  //
  // For composite indexes, this is always 2 or more fields.
  // The last field entry is always for the field path \`__name__\`. If, on
  // creation, \`__name__\` was not specified as the last field, it will be added
  // automatically with the same direction as that of the last field defined. If
  // the final field in a composite index is not directional, the \`__name__\`
  // will be ordered ASCENDING (unless explicitly specified).
  //
  // For single field indexes, this will always be exactly one entry with a
  // field path equal to the field path of the associated field.
  repeated IndexField fields = 3;
}
`;

let _indexRoot: protobuf.Root | null | undefined = null;

function makeResourceName(
  projectId: string,
  collectionName: string,
  database = "(default)"
): string {
  return `projects/${projectId}/databases/${database}/collectionGroups/${collectionName}/indexes/_`;
}

function generateCreateCompositeFirestoreIndexUrl(
  projectId: string,
  collectionName: string,
  options: IndexOptions,
  database = "(default)"
): string {
  if (!_indexRoot) {
    const parseResult = protobuf.parse(_indexProto, {
      keepCase: true,
    });
    _indexRoot = parseResult.root;
  }
  const name = makeResourceName(projectId, collectionName, database);
  const index = _indexRoot.lookupType("Index");
  const indexField = _indexRoot.lookupType("IndexField");
  const payload = {
    name,
    query_scope: options.queryScope,
    fields: options.fields.map((f) =>
      indexField.create({
        field_path: f.fieldPath,
        order: f.order,
      })
    ),
  };
  const message = index.create(payload);
  const buffer = index.encode(message).finish();
  const asString = buffer.toString();
  const asBase64 = Buffer.from(asString).toString("base64url");
  return `https://console.firebase.google.com/project/${projectId}/firestore/indexes?create_composite=${asBase64}`;
}

export function createIndexUrlOnRequestHandler(
  req: functions.Request,
  res: functions.Response
): void {
  if (req.method !== "GET") {
    res.status(404).send("Not Found.");
    return;
  }

  const { query } = req;
  const { collection, queryScope, fields } = query;
  if (!collection || typeof collection != "string") {
    res.status(400).send("Invalid collection name.");
    return;
  }
  if (
    !queryScope ||
    typeof queryScope != "string" ||
    !["collection", "collectionGroup"].includes(queryScope)
  ) {
    res
      .status(400)
      .send(
        'Invalid query scope, must be either "collection" or "collectionGroup".'
      );
    return;
  }
  const fieldsError =
    'Invalid fields, must be a comma delimited sting of fields and orders, e.g. "name,asc,surname,desc".';
  if (!fields || typeof fields != "string" || !fields.includes(",")) {
    res.status(400).send(fieldsError);
    return;
  }
  const fieldValues = fields.split(",");
  if (fieldValues.length % 2) {
    // Must be an even number of values.
    res.status(400).send(fieldsError);
    return;
  }
  const indexFields: IndexFieldOptions[] = [];
  for (var i = 0; i < fieldValues.length; i += 2) {
    const [fieldPath, order] = fieldValues.slice(i, i + 2);
    if (!["asc", "desc"].includes(order)) {
      res.status(400).send(fieldsError);
      return;
    }
    indexFields.push({
      fieldPath,
      order: order == "asc" ? QueryOrder.ASCENDING : QueryOrder.DESCENDING,
    });
  }
  // All indexes should automatically have order by __name__ desc.
  indexFields.push({
    fieldPath: "__name__",
    order: QueryOrder.DESCENDING,
  });

  const createIndexUrl = generateCreateCompositeFirestoreIndexUrl(
    config.projectId,
    collection,
    {
      queryScope:
        queryScope == "collection"
          ? QueryScope.COLLECTION
          : QueryScope.COLLECTION_GROUP,
      fields: indexFields,
    }
  );

  res.redirect(createIndexUrl);
}
