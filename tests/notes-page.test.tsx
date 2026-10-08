import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({ client: vi.fn(), getUser: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("@/app/login/actions", () => ({ signOut: vi.fn() }));
vi.mock("@/app/notes/actions", () => ({ createNote: vi.fn(), deleteNote: vi.fn() }));
import NotesPage from "@/app/notes/page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.client.mockResolvedValue({ auth: { getUser: mocks.getUser }, from: () => ({ select: mocks.select }) });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "owner", email: "user@example.com" } }, error: null });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ order: mocks.order });
});

it("requires a verified user before querying notes", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  await expect(NotesPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/login");
  expect(mocks.select).not.toHaveBeenCalled();
});

it("loads the owner's notes newest first and escapes their content", async () => {
  mocks.order.mockResolvedValue({ data: [{ id: "note", content: "<script>alert(1)</script>", created_at: "2026-10-08T00:00:00Z" }], error: null });
  const html = renderToStaticMarkup(await NotesPage({ searchParams: Promise.resolve({}) }));
  expect(mocks.eq).toHaveBeenCalledWith("user_id", "owner");
  expect(mocks.order).toHaveBeenCalledWith("created_at", { ascending: false });
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>alert(1)</script>");
});

it("distinguishes a failed query from an empty list", async () => {
  mocks.order.mockResolvedValue({ data: null, error: new Error("database") });
  const html = renderToStaticMarkup(await NotesPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("메모를 불러오지 못했습니다");
  expect(html).not.toContain("아직 메모가 없습니다");
});
