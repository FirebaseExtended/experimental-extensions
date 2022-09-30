import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useEffect, useState } from "react";
import { useActionData } from "@remix-run/react";
import qs from "qs";
import { Label } from "~/components/Label";
import { createBundle, getBundle, Timestamp } from "~/firebase.server";
import type { Bundle } from "~/types";

export const action: ActionFunction = async ({ request }) => {
  const text = await request.text();
  const form = qs.parse(text);

  const id = form.id as string;

  if (await getBundle(id)) {
    return json({ error: "Bundle with that ID already exists!" });
  }

  const data: Omit<Bundle, "id"> = {
    clientCache: (form.clientCache as string) || null,
    serverCache: (form.serverCache as string) || null,
    fileCache: (form.fileCache as string) || null,
    notBefore: (form.notBefore as string)
      ? Timestamp.fromDate(new Date(form.notBefore as string))
      : null,
    docs: form.docs ? (form.docs as string).split(",") : null,
    params: {},
    queries: {},
  };

  if (Array.isArray(form.params)) {
    for (const _param of form.params) {
      const param = _param as any;
      const { name, required, type } = param;

      if (!name) {
        continue;
      }

      data.params![name] = {
        required: required === "true",
        type: type || "string",
      };
    }
  }


  if (Array.isArray(form.query)) {
    for (const _query of form.query) {
      const query = _query as any;
      const id = query.id;
      const collection = query.collection;

      if (!id || !collection) {
        continue;
      }

      data.queries![id] = {
        collection,
        conditions: [],
      };

      if (Array.isArray(query.condition)) {
        query.condition.forEach((condition: any) => {
          const type = condition.type;

          switch (type) {
            case "startAt":
            case "startAfter":
            case "endAt":
            case "endBefore":
              data.queries![id].conditions!.push({
                [condition.type]: condition.value,
              });
              break;
            case "limit":
            case "limitToLast":
            case "offset":
              data.queries![id].conditions!.push({
                [condition.type]: parseInt(condition.value),
              });
              break;
            case "orderBy":
              data.queries![id].conditions!.push({
                [condition.type]: [condition.value, condition.direction],
              });
              break;
            case "where":
              data.queries![id].conditions!.push({
                [condition.type]: [
                  condition.field,
                  condition.op,
                  condition.value,
                ],
              });
              break;
          }
        });
      }
    }
  }
  
  await createBundle(id, data);
  return redirect(`/`);
};

export default function Create() {
  const [queries, setQueries] = useState(0);
  const [params, setParams] = useState(0);
  const action = useActionData();

  useEffect(() => {
    if (action?.error) {
      alert(action.error);
    }
  }, [action?.error]);

  return (
    <div className="max-w-5xl mx-auto">
      <h2>Create a new bundle</h2>
      <form method="post" action="/create">
        <Label
          label="Bundle ID *"
          description="A required type for the bundle name. This is used to accept incoming HTTP requests from the callable function, e,g `/bundles/<bundleName>`."
        >
          <input name="id" type="text" required placeholder="users" />
        </Label>
        <Label
          label="Client Cache"
          description="An optional value. Specifies how long to keep the bundle in the client's cache, in seconds. If not defined, client-side cache is disabled."
        >
          <input name="clientCache" type="number" />
        </Label>
        <Label
          label="Server Cache"
          description="An optional value. Only use in combination with Firebase Hosting. Specifies how long to keep the bundle in Firebase Hosting's CDN cache, in seconds.  If not defined, Hosting CDN cache is accessed."
        >
          <input name="serverCache" type="number" />
        </Label>
        <Label
          label="File Cache"
          description="An optional value. Specifies how long (in seconds) to keep the bundle in a Cloud Storage bucket, in seconds. If not defined, Cloud Storage bucket is not accessed."
        >
          <input name="fileCache" type="number" />
        </Label>
        <Label
          label="Not Before File Cache"
          description="An optional value. If a 'File Cache' is specified, ignore bundles created before this timestamp."
        >
          <input name="notBefore" type="datetime-local" />
        </Label>
        <Label
          label="Documents"
          description="A comma separated list of document paths. If specified, only these documents will be included in the bundle."
        >
          <input name="docs" type="string" />
        </Label>
        <Label
          label="Params"
          description="Optional params to define. Can be referenced in queries via the `$param` notation and provided via HTTP query params (e.g. ?name=)."
        />
        <button
          type="button"
          onClick={() => setParams(($) => $ + 1)}
          className="rounded border px-3 py-2 text-sm"
        >
          Add Param +
        </button>
        {Array(params)
          .fill("")
          .map((_, i) => {
            return <Param index={i} key={i} />;
          })}
        <Label
          label="Queries"
          description="A list of queries to include in the bundle. Each query has its own unique ID a client can use via the `namedQuery` API."
        />

        <div className="mb-2">
          <button
            type="button"
            onClick={() => {
              console.log("Click");
              setQueries(($) => $ + 1);
            }}
            className="rounded border px-3 py-2 text-sm"
          >
            Add Query +
          </button>
        </div>
        <div>
          {Array(queries)
            .fill("")
            .map((_, i) => {
              return <Queries index={i} key={i} />;
            })}
        </div>
        <div className="mt-6 flex justify-end">
          <button type="submit">Create Bundle &rarr;</button>
        </div>
      </form>
    </div>
  );
}

function Param(props: { index: number }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Label label="Name">
        <input name={`params[${props.index}][name]`} type="string" required />
      </Label>
      <Label label="Required">
        <select name={`params[${props.index}][required]`}>
          <option value="true">Required</option>
          <option value="false">Not Required</option>
        </select>
      </Label>
      <Label label="Type">
        <select name={`params[${props.index}][type]`}>
          <option value="string">string</option>
          <option value="integer">integer</option>
          <option value="float">float</option>
          <option value="boolean">boolean</option>
          <option value="integer-array">integer-array</option>
          <option value="float-array">float-array</option>
          <option value="string-array">string-array</option>
        </select>
      </Label>
    </div>
  );
}

function Queries(props: { index: number }) {
  const [conditions, setConditions] = useState(0);

  return (
    <div className="border px-3 mb-3">
      <Label
        label="Query ID"
        description="The unique query ID to be added to the bundle."
      >
        <input name={`query[${props.index}][id]`} type="string" required />
      </Label>
      <Label
        label="The collection ID to perform the query on."
        description="The unique query ID to be added to the bundle."
      >
        <input
          name={`query[${props.index}][collection]`}
          type="string"
          required
        />
      </Label>
      <div className="my-3">
        <button
          type="button"
          onClick={() => setConditions(($) => $ + 1)}
          className="rounded border px-3 py-2 text-sm"
        >
          Add Condition +
        </button>
      </div>
      {Array(conditions)
        .fill("")
        .map((_, i) => {
          return <Condition index={i} queryIndex={props.index} key={i} />;
        })}
    </div>
  );
}

function Condition(props: { index: number; queryIndex: number }) {
  const [type, setType] = useState("where");

  const stringInput = () => <input type="text" name={`query[${props.queryIndex}][condition][${props.index}][value]`} />;
  const numberInput = () => <input type="number" name={`query[${props.queryIndex}][condition][${props.index}][value]`} />;
  const orderInput = () => (
    <div className="grid grid-cols-2 gap-3">
      <input type="string" name={`query[${props.queryIndex}][condition][${props.index}][value]`} />
      <select name={`query[${props.queryIndex}][condition][${props.index}][direction]`}>
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </div>
  )
  const whereInput = () => (
    <div className="grid grid-cols-3 gap-3">
      <input type="string" name={`query[${props.queryIndex}][condition][${props.index}][field]`} />
      <select name={`query[${props.queryIndex}][condition][${props.index}][op]`}>
        <option value="<">{'<'}</option>
        <option value="<=">{'<='}</option>
        <option value="==">{'=='}</option>
        <option value="!=">{'!='}</option>
        <option value=">=">{'>='}</option>
        <option value=">">{'>'}</option>
      </select>
      <input type="string" name={`query[${props.queryIndex}][condition][${props.index}][value]`} />
    </div>
  );

  const value = () => {
    switch(type) {
      case 'startAt':
      case 'startAfter':
      case 'endAt':
      case 'endBefore':
        return stringInput();
      case 'limit':
      case 'limitToLast':
      case 'offset':
        return numberInput();
      case 'orderBy':
        return orderInput();
      case 'where':
        return whereInput();
    }
  };

  return (
    <div className="border p-3 mb-3">
      <Label label="Condition Type">
        <select
          name={`query[${props.queryIndex}][condition][${props.index}][type]`}
          onChange={(e) => {
            setType(e.target.value);
          }}
        >
          <option value="where">Where</option>
          <option value="orderBy">Order By</option>
          <option value="limit">Limit</option>
          <option value="limitToLast">Limit To Last</option>
          <option value="offset">Offset</option>
          <option value="startAt">Start At</option>
          <option value="startAfter">Start After</option>
          <option value="endAt">End At</option>
          <option value="endBefore">End Before</option>
        </select>
      </Label>
      <Label label="Condition Type">
        {value()}
      </Label>
    </div>
  );
}