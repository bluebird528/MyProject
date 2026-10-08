import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ create: vi.fn(), getUser: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.create }));
import { proxy } from "@/proxy";

afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

it("refreshes sessions and preserves cookies on both request and response", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-public-key");
  mocks.create.mockImplementation((_url, _key, options) => {
    mocks.getUser.mockImplementation(async () => {
      expect(options.cookies.getAll()).toEqual([{ name: "session", value: "old" }]);
      options.cookies.setAll([{ name: "session", value: "refreshed", options: { httpOnly: true, path: "/", sameSite: "lax" } }]);
      return { data: { user: { id: "owner" } }, error: null };
    });
    return { auth: { getUser: mocks.getUser } };
  });
  const request = new NextRequest("https://app.example/notes", { headers: { cookie: "session=old" } });
  const response = await proxy(request);
  expect(mocks.getUser).toHaveBeenCalledOnce();
  expect(request.cookies.get("session")?.value).toBe("refreshed");
  expect(response.cookies.get("session")).toMatchObject({ value: "refreshed", httpOnly: true, path: "/", sameSite: "lax" });
  expect(response.headers.get("x-middleware-request-cookie")).toContain("session=refreshed");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
});
