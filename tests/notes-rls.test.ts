import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, expect, it } from "vitest";

const db = new PGlite();
const owner = "11111111-1111-1111-1111-111111111111";
const other = "22222222-2222-2222-2222-222222222222";

beforeAll(async () => {
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
    insert into auth.users values ('${owner}'), ('${other}');
  `);
  await db.exec(readFileSync(new URL("../supabase/migrations/20261008000000_create_notes.sql", import.meta.url), "utf8"));
}, 30000);
afterAll(async () => { await db.close(); });

it("enforces select, insert and delete isolation, and denies anonymous access and updates", async () => {
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${owner}';`);
  await db.query("insert into public.notes (user_id, content) values ($1, 'owner note')", [owner]);
  await expect(db.query("insert into public.notes (user_id, content) values ($1, 'forged')", [other])).rejects.toThrow(/row-level security/);
  await expect(db.exec("update public.notes set content = 'changed'")).rejects.toThrow(/permission denied/);
  await expect(db.query("insert into public.notes (user_id, content) values ($1, '   ')", [owner])).rejects.toThrow(/check constraint/);
  await db.exec(`set request.jwt.claim.sub = '${other}';`);
  expect((await db.query("select * from public.notes")).rows).toHaveLength(0);
  await db.exec("delete from public.notes");
  await db.query("insert into public.notes (user_id, content) values ($1, 'other note')", [other]);
  await db.exec(`set request.jwt.claim.sub = '${owner}';`);
  expect((await db.query("select content from public.notes")).rows).toEqual([{ content: "owner note" }]);
  await db.exec("delete from public.notes");
  expect((await db.query("select * from public.notes")).rows).toHaveLength(0);
  await db.exec(`set request.jwt.claim.sub = '${other}';`);
  expect((await db.query("select content from public.notes")).rows).toEqual([{ content: "other note" }]);
  await db.exec("reset role; set role anon;");
  await expect(db.exec("select * from public.notes")).rejects.toThrow(/permission denied/);
  await expect(db.query("insert into public.notes (user_id, content) values ($1, 'anonymous')", [owner])).rejects.toThrow(/permission denied/);
  await expect(db.exec("delete from public.notes")).rejects.toThrow(/permission denied/);
});
