import type { MetaFunction, LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import tailwind from "./tailwind.css";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Firestore Bundle Server - Admin Dashboard",
  viewport: "width=device-width,initial-scale=1",
});


export const links: LinksFunction = () => [{ rel: "stylesheet", href: tailwind }];

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <header className="max-w-5xl mx-auto py-6">
          <h1 className="text-2xl text-center font-bold">
            Firestore Bundle Server - Admin Dashboard
          </h1>
        </header>
        <main>
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}