import { Hono } from "hono";
import { cors } from "hono/cors";
import { routes } from "./routes";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({ origin: "*", allowHeaders: ["Authorization", "Content-Type"] }));
// Django accepted a trailing slash (/task/, /auth/token/); accept both
app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
    return app.fetch(new Request(url, c.req.raw), c.env, c.executionCtx);
  }
  await next();
});
app.route("/", routes);

export default app;
