import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { hashPassword, issueToken, requireAuth, verifyPassword, verifyToken } from "./auth";
import { RANGES, buildAnalytics, type Range } from "./analytics";
import type { Env } from "./types";

type App = { Bindings: Env; Variables: { userId: number } };

const STATUSES = ["TODO", "IN PROGRESS", "COMPLETED", "BLOCKED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

const signupSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  password: z.string().min(1),
});

const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
const refreshSchema = z.object({ refresh: z.string().min(1) });

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  due_date: z.string().datetime({ offset: true }).nullable().optional(),
  assigned_to: z.string().max(100).nullable().optional(),
});

const TASK_COLUMNS = "id, title, description, status, priority, due_date, assigned_to, position, created_at, updated_at";
// bottom of a (user, status) column; bind (user id, status)
const NEXT_POSITION = "COALESCE((SELECT MAX(position) + 1 FROM task WHERE created_by = ? AND status = ?), 0)";
const NOT_FOUND = { status: "error", data: "No tasks found" };

export const routes = new Hono<App>();

routes.get("/", (c) => c.json({ message: "Welcome to the Task Management API" }));

// --- auth ---
routes.post("/auth/signup", zValidator("json", signupSchema), async (c) => {
  const { email, first_name, last_name, password } = c.req.valid("json");
  const username = email.toLowerCase().trim();

  const existing = await c.env.DB.prepare("SELECT 1 FROM user WHERE username = ?").bind(username).first();
  if (existing) {
    return c.json({ status: "error", data: "A user with this email already exists" }, 400);
  }

  await c.env.DB.prepare("INSERT INTO user (username, first_name, last_name, password_hash) VALUES (?, ?, ?, ?)")
    .bind(username, first_name, last_name, await hashPassword(password))
    .run();
  return c.json({ status: "success", data: { email, first_name, last_name } }, 201);
});

routes.post("/auth/token", zValidator("json", loginSchema), async (c) => {
  const { username, password } = c.req.valid("json");
  const user = await c.env.DB.prepare("SELECT id, password_hash FROM user WHERE username = ?")
    .bind(username.toLowerCase().trim())
    .first<{ id: number; password_hash: string }>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ detail: "No active account found with the given credentials" }, 401);
  }
  return c.json({
    access: await issueToken(user.id, "access", c.env.JWT_SECRET),
    refresh: await issueToken(user.id, "refresh", c.env.JWT_SECRET),
  });
});

routes.post("/auth/token/refresh", zValidator("json", refreshSchema), async (c) => {
  const userId = await verifyToken(c.req.valid("json").refresh, "refresh", c.env.JWT_SECRET);
  if (userId === null) return c.json({ detail: "Token is invalid or expired" }, 401);
  return c.json({ access: await issueToken(userId, "access", c.env.JWT_SECRET) });
});

// --- tasks ---
routes.use("/task/*", requireAuth);
routes.use("/task", requireAuth);
routes.use("/analytics", requireAuth);

routes.get("/analytics", async (c) => {
  const range = c.req.query("range") ?? "week";
  if (!RANGES.includes(range as Range)) {
    return c.json({ status: "error", data: `range must be one of: ${RANGES.join(", ")}` }, 400);
  }
  const { results } = await c.env.DB.prepare(
    "SELECT status, priority, due_date, created_at, updated_at FROM task WHERE created_by = ?",
  )
    .bind(c.get("userId"))
    .all<{ status: string; priority: string; due_date: string | null; created_at: string; updated_at: string }>();
  return c.json(buildAnalytics(results, range as Range));
});

routes.get("/task", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${TASK_COLUMNS} FROM task WHERE created_by = ? ORDER BY position ASC, created_at DESC, id DESC`,
  )
    .bind(c.get("userId"))
    .all();
  if (results.length === 0) return c.json(NOT_FOUND, 404);
  return c.json(results);
});

routes.post("/task", zValidator("json", taskSchema), async (c) => {
  const t = c.req.valid("json");
  const status = t.status ?? "TODO";
  const row = await c.env.DB.prepare(
    `INSERT INTO task (title, description, status, priority, due_date, assigned_to, created_by, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ${NEXT_POSITION}) RETURNING ${TASK_COLUMNS}`,
  )
    .bind(
      t.title, t.description ?? null, status, t.priority ?? "LOW", t.due_date ?? null, t.assigned_to ?? null,
      c.get("userId"),
      c.get("userId"), status,
    )
    .first();
  return c.json(row, 201);
});

const reorderSchema = z.object({
  items: z
    .array(z.object({ id: z.number().int(), status: z.enum(STATUSES), position: z.number().int().min(0) }))
    .min(1)
    .max(500),
});

// set column and order for many tasks at once
routes.post("/task/reorder", zValidator("json", reorderSchema), async (c) => {
  const { items } = c.req.valid("json");
  const ids = items.map((i) => i.id);
  if (new Set(ids).size !== ids.length) return c.json({ status: "error", data: "Duplicate task ids" }, 400);

  const userId = c.get("userId");
  const { results } = await c.env.DB.prepare(
    `SELECT id FROM task WHERE created_by = ? AND id IN (${ids.map(() => "?").join(",")})`,
  )
    .bind(userId, ...ids)
    .all();
  if (results.length !== ids.length) return c.json(NOT_FOUND, 404);

  // a status change counts as activity (analytics), a pure reorder does not
  const update = c.env.DB.prepare(
    `UPDATE task SET
       updated_at = CASE WHEN status != ?1 THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') ELSE updated_at END,
       status = ?1, position = ?2
     WHERE id = ?3 AND created_by = ?4`,
  );
  await c.env.DB.batch(items.map((i) => update.bind(i.status, i.position, i.id, userId)));
  return c.json({ status: "success" });
});

const findTask = (c: { env: Env; get: (k: "userId") => number }, id: number) =>
  c.env.DB.prepare(`SELECT ${TASK_COLUMNS} FROM task WHERE id = ? AND created_by = ?`)
    .bind(id, c.get("userId"))
    .first<Record<string, unknown>>();

routes.get("/task/:id{[0-9]+}", async (c) => {
  const task = await findTask(c, Number(c.req.param("id")));
  return task ? c.json(task) : c.json(NOT_FOUND, 404);
});

routes.put("/task/:id{[0-9]+}", zValidator("json", taskSchema), async (c) => {
  const id = Number(c.req.param("id"));
  const current = await findTask(c, id);
  if (!current) return c.json(NOT_FOUND, 404);

  const t = c.req.valid("json");
  // fields omitted from the body keep their current value (matches DRF full update with defaults)
  const status = t.status ?? (current.status as string);
  // changing column (modal edit, overdue auto-block, ...) drops the task at the bottom
  const moved = status !== current.status;
  const userId = c.get("userId");
  const row = await c.env.DB.prepare(
    `UPDATE task SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, assigned_to = ?,
       position = ${moved ? NEXT_POSITION : "position"},
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ? AND created_by = ? RETURNING ${TASK_COLUMNS}`,
  )
    .bind(
      t.title,
      t.description === undefined ? current.description : t.description,
      status,
      t.priority ?? current.priority,
      t.due_date === undefined ? current.due_date : t.due_date,
      t.assigned_to === undefined ? current.assigned_to : t.assigned_to,
      ...(moved ? [userId, status] : []),
      id,
      userId,
    )
    .first();
  return c.json(row);
});

routes.delete("/task/:id{[0-9]+}", async (c) => {
  const res = await c.env.DB.prepare("DELETE FROM task WHERE id = ? AND created_by = ?")
    .bind(Number(c.req.param("id")), c.get("userId"))
    .run();
  if (res.meta.changes === 0) return c.json(NOT_FOUND, 404);
  return c.body(null, 204);
});
