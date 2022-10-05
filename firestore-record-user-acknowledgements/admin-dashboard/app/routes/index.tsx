import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { AnchorButton } from "~/components/Button";

import { getNotices } from "~/firebase.server";
import type { Notice } from "~/types";

export const loader: LoaderFunction = async () => {
  return json({
    notices: await getNotices(),
  });
};

type LoaderData = {
  notices: Notice[];
};

export default function Index() {
  const { notices } = useLoaderData<LoaderData>();
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-end p-3 mb-2">
        <AnchorButton href="/create">Create Notice &rarr;</AnchorButton>
      </div>
      <table className="w-full table-auto border border-spacing-0.5">
        <thead>
          <tr className="text-left [&>th]:p-4 bg-slate-100">
            <th>Notice ID</th>
            <th>Type</th>
            <th>Version</th>
            <th>Title</th>
            <th>Description</th>
            <th>Link</th>
            <th>Created At</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {notices.map((notice: any) => (
            <tr
              key={notice.id}
              className="border-t [&>td]:p-3 [&>.code]:font-mono"
            >
              <td className="code">{notice.id}</td>
              <td className="code">{notice.type}</td>
              <td>{notice.version || "N/A"}</td>
              <td>{notice.title || "N/A"}</td>
              <td>{notice.description || "N/A"}</td>
              <td>{notice.link || "N/A"}</td>
              <td>{notice.createdAt._seconds}</td>
              <td>
                <a href={`/notices/${notice.id}`}>Manage &rarr;</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
