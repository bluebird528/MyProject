import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  createServerClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

import { createClient } from "@/lib/supabase/server";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

describe("createClient", () => {
  it("propagates the dynamic rendering bailout before checking missing configuration", async () => {
    const bailout = new Error("Dynamic server usage: cookies");
    mocks.cookies.mockRejectedValue(bailout);

    await expect(createClient()).rejects.toBe(bailout);

    expect(mocks.cookies).toHaveBeenCalledOnce();
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it.each([
    [undefined, undefined],
    [undefined, "test-public-key"],
    ["https://example.supabase.co", undefined],
  ])("validates missing configuration after awaiting cookies (url=%s, key=%s)", async (url, key) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key);
    let resolveCookies!: (store: object) => void;
    mocks.cookies.mockReturnValue(new Promise((resolve) => {
      resolveCookies = resolve;
    }));

    const result = createClient();
    const rejection = expect(result).rejects.toThrow(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set.",
    );
    expect(mocks.cookies).toHaveBeenCalledOnce();
    expect(mocks.createServerClient).not.toHaveBeenCalled();
    resolveCookies({});

    await rejection;
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("creates a client with the request cookie store when configuration is present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-public-key");
    const cookieStore = {
      getAll: vi.fn(() => [{ name: "session", value: "old" }]),
      set: vi.fn(),
    };
    const client = { auth: {} };
    mocks.cookies.mockResolvedValue(cookieStore);
    mocks.createServerClient.mockReturnValue(client);

    await expect(createClient()).resolves.toBe(client);

    expect(mocks.createServerClient).toHaveBeenCalledExactlyOnceWith(
      "https://example.supabase.co",
      "test-public-key",
      { cookies: { getAll: expect.any(Function), setAll: expect.any(Function) } },
    );
    const options = mocks.createServerClient.mock.calls[0][2];
    expect(options.cookies.getAll()).toEqual([{ name: "session", value: "old" }]);
    options.cookies.setAll([
      { name: "session", value: "new", options: { httpOnly: true } },
    ]);
    expect(cookieStore.set).toHaveBeenCalledWith("session", "new", { httpOnly: true });
  });
});
