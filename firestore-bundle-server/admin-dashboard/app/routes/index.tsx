import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { getBundles } from "~/firebase.server";
import type { Bundle } from "~/types";

export const loader: LoaderFunction = async () => {
  return json({
    bundles: await getBundles(),
  });
};

type LoaderData = {
  bundles: Bundle[];
};

export default function Index() {
  const { bundles } = useLoaderData<LoaderData>();
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-end p-3 mb-2">
        <a href="/create">Create Bundle &rarr;</a>
      </div>
      <table className="w-full table-auto border border-spacing-0.5">
        <thead>
          <tr className="text-left [&>th]:p-4 bg-slate-100">
            <th>Bundle ID</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {bundles.map((bundle) => (
            <tr
              key={bundle.id}
              className="border-t [&>td]:p-3 [&>.code]:font-mono"
            >
              <td className="code">{bundle.id}</td>
              <td>
                <a href={`/bundles/${bundle.id}`}>Manage &rarr;</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}