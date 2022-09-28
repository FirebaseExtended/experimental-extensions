import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Label } from "~/components/Label";

import type { Notice, Acknowledgement } from "~/types";
import { getAcknowledgements, getNotice, updateNotice } from "~/firebase.server";

export const loader: LoaderFunction = async ({ params }) => {
  const id = params.noticeId as string;

  const [notice, acknowledgements] = await Promise.all([
    getNotice(id),
    getAcknowledgements(id),
  ])

  if (!notice) {
    throw new Response("Notice not found", { status: 404 });
  }

  return json({
    notice,
    acknowledgements,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();

  const id = form.get("id") as string;
  const data = {
    title: form.get("title"),
    description: form.get("description"),
    link: form.get("link"),
    allowList: form.get("allowList"),
  };

  // TODO: validate form fields

  await updateNotice(id, data);
  return redirect(`/notices/${id}`);
};

type LoaderData = {
  notice: Notice;
  acknowledgements: Acknowledgement[];
};

export default function NoticePage() {
  const { notice, acknowledgements } = useLoaderData<LoaderData>();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4">
        <a href="/">&larr; Back</a>
      </div>
      <h2 className="text-xl font-bold">Manage Notice ({notice.id})</h2>
      <form method="post" action={`/notices/${notice.id}`}>
        <input type="hidden" name="id" value={notice.id} />
        <Label
          label="Notice Type *"
          description="A required type for the notice. This is used to identify the notice and is used to determine which users have acknowledged the notice. Use an existing type to create a new instance of a notice (e.g. updated terms and conditions which require new acknowlegement)."
        >
          <input name="type" type="text" value={notice.type} disabled />
        </Label>
        <Label
          label="Notice Version"
          description="An optional notice version. This can be used to filter a specific notice versions via the `getNotice` callable function."
        >
          <input name="version" type="number" value={notice.version} disabled />
        </Label>
        <Label
          label="Notice Title"
          description="An optional title to provide to the notice. Applications may use this to outline the notice intent."
        >
          <input name="title" type="text" defaultValue={notice.title || ""} />
        </Label>
        <Label
          label="Notice Description"
          description="An optional description to provide to the notice. Applications may use this to show detailed information about the notice."
        >
          <textarea
            name="description"
            defaultValue={notice.description || ""}
          ></textarea>
        </Label>
        <Label
          label="Notice Link"
          description="An optional URL to provide to the notice. Applications may use this to redirect users to another page / external resource for further information."
        >
          <input name="link" type="text" defaultValue={notice.link || ""} />
        </Label>
        <Label
          label="Allow List"
          description="An optional command separated list of user IDs. If provided, only users with IDs in the list will be able to acknowledge the notice."
        >
          <input
            name="allowList"
            type="text"
            defaultValue={notice.allowList || ""}
          />
        </Label>
        <div className="mt-6 flex justify-end">
          <button type="submit">Update Notice &rarr;</button>
        </div>
      </form>
      <hr className="my-6" />
      <h2 className="text-xl font-bold mb-4">Notice Acknowledgements</h2>
      <table className="w-full table-auto border border-spacing-0.5">
        <thead>
          <tr className="text-left [&>th]:p-4 bg-slate-100">
            <th>ID</th>
            <th>User ID</th>
            <th>Timestamp</th>
            <th>Type</th>
            <th>Metadata</th>
          </tr>
        </thead>
        <tbody>
          {acknowledgements.map((acknowledgement: any) => (
            <tr key={acknowledgement.id}>
              <td>{acknowledgement.id}</td>
              <td>{acknowledgement.userId}</td>
              <td>todo</td>
              <td>{acknowledgement.type}</td>
              <td>{JSON.stringify(acknowledgement.metadata || {})}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
