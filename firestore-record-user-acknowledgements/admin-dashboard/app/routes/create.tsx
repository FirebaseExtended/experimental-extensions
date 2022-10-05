import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Button } from "~/components/Button";
import { Input } from "~/components/form";
import { Label } from "~/components/Label";

import { createNotice } from "~/firebase.server";

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();

  const data = {
    type: form.get("type"),
    version: form.has("version")
      ? parseInt(form.get("version")!.toString())
      : null,
    title: form.get("title"),
    description: form.get("description"),
    link: form.get("link"),
    allowList: form.get("allowList") ? (form.get("allowList") as string).split(",") : [],
  };

  // TODO: should we check if a version already exists for this type?
  // TODO: validate form fields

  const id = await createNotice(data);
  return redirect(`/notices/${id}`);
};

export default function Create() {
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold leading-tight tracking-tight">
        Create a new notice
      </h2>
      <form method="post" action="/create">
        <Label
          label="Notice Type *"
          description="A required type for the notice. This is used to identify the notice and is used to determine which users have acknowledged the notice. Use an existing type to create a new instance of a notice (e.g. updated terms and conditions which require new acknowlegement)."
        >
          <Input
            name="type"
            type="text"
            placeholder="terms-and-conditions"
            required
          />
        </Label>
        <Label
          label="Notice Version"
          description="An optional notice version. This can be used to filter a specific notice versions via the `getNotice` callable function."
        >
          <Input name="version" type="number" />
        </Label>
        <Label
          label="Notice Title"
          description="An optional title to provide to the notice. Applications may use this to outline the notice intent."
        >
          <Input name="title" type="text" />
        </Label>
        <Label
          label="Notice Description"
          description="An optional description to provide to the notice. Applications may use this to show detailed information about the notice."
        >
          <textarea name="description"></textarea>
        </Label>
        <Label
          label="Notice Link"
          description="An optional URL to provide to the notice. Applications may use this to redirect users to another page / external resource for further information."
        >
          <Input name="link" type="text" />
        </Label>
        <Label
          label="Allow List"
          description="An optional command separated list of user IDs. If provided, only users with IDs in the list will be able to acknowledge the notice."
        >
          <Input name="allowList" type="text" />
        </Label>
        <div className="mt-6 flex justify-end">
          <Button type="submit">Create Notice &rarr;</Button>
        </div>
      </form>
    </div>
  );
}