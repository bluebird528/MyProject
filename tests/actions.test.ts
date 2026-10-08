import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  client: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); }),
  revalidate: vi.fn(), getUser: vi.fn(), signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(),
  from: vi.fn(), insert: vi.fn(), remove: vi.fn(), eq: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { authenticate, signOut } from "@/app/login/actions";
import { createNote, deleteNote } from "@/app/notes/actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.redirect.mockImplementation((path) => { throw new Error(`redirect:${path}`); });
  mocks.client.mockResolvedValue({ auth: { getUser: mocks.getUser, signInWithPassword: mocks.signIn, signUp: mocks.signUp, signOut: mocks.signOut }, from: mocks.from });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "owner" } }, error: null });
  mocks.from.mockReturnValue({ insert: mocks.insert, delete: mocks.remove });
  mocks.insert.mockResolvedValue({ error: null });
  mocks.remove.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ eq: mocks.eq, error: null });
});

describe("email authentication", () => {
  const credentials = { email: "user@example.com", password: "password123", mode: "login" };
  it("logs in and redirects to notes", async () => {
    mocks.signIn.mockResolvedValue({ error: null });
    await expect(authenticate({}, form(credentials))).rejects.toThrow("redirect:/notes");
    expect(mocks.signIn).toHaveBeenCalledWith({ email: credentials.email, password: credentials.password });
  });
  it("reports incorrect credentials without redirecting", async () => {
    mocks.signIn.mockResolvedValue({ error: new Error("invalid") });
    expect(await authenticate({}, form(credentials))).toHaveProperty("error");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("asks for email confirmation when signup has no session", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    expect(await authenticate({}, form({ ...credentials, mode: "signup" }))).toHaveProperty("message");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("redirects after signup with an active session", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: {} }, error: null });
    await expect(authenticate({}, form({ ...credentials, mode: "signup" }))).rejects.toThrow("redirect:/notes");
  });
  it("rejects invalid input before calling Supabase", async () => {
    expect(await authenticate({}, form({ ...credentials, email: "invalid" }))).toHaveProperty("error");
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("signs out and redirects", async () => {
    mocks.signOut.mockResolvedValue({ error: null });
    await expect(signOut()).rejects.toThrow("redirect:/login");
  });
});

describe("note actions", () => {
  it("uses verified ownership instead of submitted user_id", async () => {
    await expect(createNote(form({ content: "  hello  ", user_id: "victim" }))).rejects.toThrow("redirect:/notes");
    expect(mocks.insert).toHaveBeenCalledWith({ content: "hello", user_id: "owner" });
    expect(mocks.revalidate).toHaveBeenCalledWith("/notes");
  });
  it.each(["", "   ", "x".repeat(10001)])("rejects empty or oversized notes", async (content) => {
    await expect(createNote(form({ content }))).rejects.toThrow("redirect:/notes?error=content");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("requires authentication for writes", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(createNote(form({ content: "hello" }))).rejects.toThrow("redirect:/login");
    await expect(deleteNote(form({ id: "11111111-1111-1111-1111-111111111111" }))).rejects.toThrow("redirect:/login");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("scopes deletion to the verified owner", async () => {
    const id = "11111111-1111-1111-1111-111111111111";
    await expect(deleteNote(form({ id }))).rejects.toThrow("redirect:/notes");
    expect(mocks.eq.mock.calls).toEqual([["id", id], ["user_id", "owner"]]);
  });
  it("reports failed writes without revalidation", async () => {
    mocks.insert.mockResolvedValue({ error: new Error("database") });
    await expect(createNote(form({ content: "hello" }))).rejects.toThrow("redirect:/notes?error=save");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
